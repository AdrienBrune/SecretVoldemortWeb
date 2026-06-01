#include <GameController.hpp>
#include <GameStatus.hpp>
#include <GameTools.hpp>
#include <Server.hpp>

#define ENSURE_SERVER_REGISTERED()                                          \
    if (!m_server)                                                          \
    {                                                                       \
        LOG_ERROR("Can't send message, server not registered !");           \
        return;                                                             \
    }


void GameController::SendMessage(const std::string& uuid, std::string message)
{
    ENSURE_SERVER_REGISTERED();

    nlohmann::json object = {
        {"type", "message"},
        {"content", {
            {"message", message}
        }}
    };
    m_server->Send(uuid, object);
}
void GameController::BroadcastMessage(std::string message)
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        SendMessage(player.GetUuid(), message);
    }
}


void GameController::SendPopup(const std::string& uuid, std::string message, int timeout, std::string image)
{
    ENSURE_SERVER_REGISTERED();

    nlohmann::json object = {
        {"type", "pop-up"},
        {"content", {
            {"message", message},
            {"timeout", timeout},
            {"image",   image}
        }}
    };
    m_server->Send(uuid, object);
}
void GameController::BroadcastPopup(std::string message, int timeout)
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        SendPopup(player.GetUuid(), message, timeout);
    }
}

void GameController::BroadCastDelay(int timeSeconds)
{
    ENSURE_SERVER_REGISTERED();

    nlohmann::json object = {
        {"type", "delay"},
        {"content", {
            {"time_sec", timeSeconds}
        }}
    };
    m_server->Broadcast(object);
}

void GameController::BroadCastChatboxMessage(const std::string& senderUuid, const std::string& message)
{
    ENSURE_SERVER_REGISTERED();

    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        nlohmann::json object = {
            {"type", "chatbox"},
            {"content", {
                {"sender", senderUuid},
                {"message", message}
            }}
        };
        m_server->Send(player.GetUuid(), object);
    }
}

void GameController::BroadCastGameStatus()
{
    ENSURE_SERVER_REGISTERED();

    m_server->Broadcast(GameStatus::GetInstance().toJson());
}


void GameController::OnCommand(const std::string& uuid, const nlohmann::json& message)
{
    LOG_INFO("OnCommand {}", message.dump());

    try
    {
        std::string command = message.at("command").get<std::string>();
        if (command == "start")
        {
            if (GameStatus::GetInstance().GetStarted())
            {
                LOG_WARNING("can't start game, game already started");
                return;
            }
            CancelPlannedTask();
            OnMachineState(uuid, GameTracker::eStep::start_game);
        }
        else if (command == "stop")
        {
            if (!GameStatus::GetInstance().GetStarted())
            {
                LOG_WARNING("can't quit game, game not started");
                return;
            }
            CancelPlannedTask();
            OnMachineState(uuid, GameTracker::eStep::quit_game);
        }
        else if (command == "rename")
        {
            std::string name = message.at(command).get<std::string>();
            if (auto player = GameStatus::GetInstance().GetPlayer(uuid))
            {
                LOG_INFO("set player id: {}, with name: {}", player->get().GetUuid(), name);
                player->get().SetName(name);
                BroadCastGameStatus();
            }
        }
        else if (command == "chatbox")
        {
            std::string chatMessage = message.at(command).get<std::string>();
            BroadCastChatboxMessage(uuid, chatMessage);
        }
        else
        {
            LOG_ERROR("unknown command name: {}", command);
        }
    }
    catch (const std::exception&)
    {
        LOG_ERROR("packet malformed: {}", message.dump());
    }
}

void GameController::OnMessage(const std::string& uuid, const nlohmann::json& message)
{
    LOG_INFO("OnMessage {}", message.dump());

    try
    {
        int step = message.at("step").get<int>();
        if (step != GameStatus::GetInstance().GetGameTracker().Get())
        {
            LOG_ERROR("step field desynchronized, received: {}, current: {}", step, (int)GameStatus::GetInstance().GetGameTracker().Get());
            return;
        }

        auto data = message.at("data").get<nlohmann::json>();

        CheckResponseValidity(uuid, step, data);
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("packet malformed: {}", message.dump());
    }
}


void GameController::CheckResponseValidity(const std::string& uuid, int step, nlohmann::json& object)
{
    ResponseData data;

    try
    {
        switch(step)
        {
            case GameTracker::eStep::director_election_begin:
                data = object.at("player").get<std::string>();
            break;

            case GameTracker::eStep::vote_collection:
                data = object.at("vote").get<std::string>();
            break;

            case GameTracker::eStep::minister_draw:
                data = object.at("draw").get<bool>();
            break;

            case GameTracker::eStep::minister_discard:
                data = object.at("law").get<std::string>();
            break;

            case GameTracker::eStep::director_discard:
                data = object.at("law").get<std::string>();
            break;

            case GameTracker::eStep::director_veto:
                data = object.at("veto").get<bool>();
            break;

            case GameTracker::eStep::minister_veto_response:
                data = object.at("veto").get<bool>();
            break;

            case GameTracker::eStep::player_to_kill_selection:
                data = object.at("player").get<std::string>();
            break;

            case GameTracker::eStep::spying_player_selection:
                data = object.at("player").get<std::string>();
            break;

            case GameTracker::eStep::minister_check_top_cards:
                data = object.at("done").get<bool>();
            break;

            case GameTracker::eStep::next_minister_selection: 
                data = object.at("player").get<std::string>();
            break;

            default:
                LOG_ERROR("incompatible step received");
                return;
        }
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("packet malformed: {}", object.dump());
    }

    std::visit([&](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, std::monostate>)
        {
            LOG_INFO("received data: [none/monostate]");
        } 
        else
        {
            LOG_INFO("received data: {}", arg);
        }
    }, data);

    OnMachineState(uuid, step, data);
}


// Helper: safe variant access — logs an error and returns nullopt if the type is incorrect
template<typename T>
static std::optional<T> GetData(const GameController::ResponseData& data, int step)
{
    const T* ptr = std::get_if<T>(&data);
    if (!ptr)
    {
        LOG_ERROR("Bad variant access at step {} ({}): expected type not held by data",
            step, GameTracker::ToString(static_cast<GameTracker::eStep>(step)));
        return std::nullopt;
    }
    return *ptr;
}

void GameController::OnMachineState(const std::string& uuid, int step, const ResponseData& data)
{
    LOG_INFO("Step in progress: {}", GameTracker::ToString(static_cast<GameTracker::eStep>(step)));

    try
    {
        switch (step)
        {
            case GameTracker::eStep::waiting_room:
            {
                BroadcastMessage("En attente du lancement d'une partie ...");

                m_imperoPower.clear();
                m_chaosFlag = false;
                break;
            }

            case GameTracker::eStep::start_game:
            {
                if (GameStatus::GetInstance().StartGame())
                {
                    GameStatus::GetInstance().SetStarted(true);
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::start_turn);

                    std::string playerName = "";
                    if (auto player = GameStatus::GetInstance().GetPlayer(uuid))
                    {
                        playerName = player->get().GetName();
                    }
                    BroadcastMessage(fmt::format("{} a lancé la partie", playerName.empty() ? "un joueur" : playerName));

                    m_firstTurn = true;

                    ScheduleTask(10, [this, uuid]() {
                        this->OnMachineState(uuid, GameTracker::eStep::start_turn, std::monostate{});
                    });
                }
                break;
            }

            case GameTracker::eStep::quit_game:
            {
                GameStatus::GetInstance().SetStarted(false);
                GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::waiting_room);

                std::string playerName = "";
                if (auto player = GameStatus::GetInstance().GetPlayer(uuid))
                {
                    playerName = player->get().GetName();
                }
                BroadcastMessage(fmt::format("{} a quitté la partie", playerName.empty() ? "un joueur" : playerName));

                OnMachineState(uuid, GameTracker::eStep::waiting_room, std::monostate{});
                break;
            }

            case GameTracker::eStep::start_turn:
            {
                if (!m_firstTurn)
                {
                    GameTools::StartNewTurn(m_chaosFlag, m_imperoPower);
                }
                m_firstTurn = false;

                if (auto player = GameTools::GetMinister())
                {
                    BroadcastMessage(fmt::format("{} sera le Ministre de la magie pour ce tour", player->get().GetName()));
                }

                ScheduleTask(4, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::director_selection);
                    this->OnMachineState(uuid, GameTracker::eStep::director_selection, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::director_selection:
            {
                BroadcastMessage("Le Ministre de la magie choisi un candidat au poste de Directeur de Poudlard");

                if (auto player = GameTools::GetMinister())
                {
                    SendPopup(player->get().GetUuid(), "Proposez un candidat au poste de directeur de Poudlard", 0);
                }

                SetInstantNextStep(GameTracker::eStep::director_election_begin);
                break;
            }

            case GameTracker::eStep::director_election_begin:
            {
                GameTools::ResetVoteSession();

                auto playerUuid = GetData<std::string>(data, step);
                if (!playerUuid)
                {
                    break;
                }
                if (auto player = GameStatus::GetInstance().GetPlayer(*playerUuid))
                {
                    player->get().SetTarget(true);

                    BroadcastMessage(fmt::format("{} a été choisi pour être éligible au poste de Directeur de Poudlard", player->get().GetName()));

                    ScheduleTask(4, [this, uuid]() {
                        GameTools::VoteSession(true);
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::vote_collection);
                        this->OnMachineState(uuid, GameTracker::eStep::vote_collection, std::monostate{});
                    });
                }
                break;
            }

            case GameTracker::eStep::vote_collection:
            {
                auto voteStr = GetData<std::string>(data, step);
                if (!voteStr)
                {
                    break;
                }

                auto player = GameStatus::GetInstance().GetPlayer(uuid);
                if (!player)
                {
                    return;
                }

                LOG_INFO("Vote collected: {}", *voteStr);
                player->get().SetVote(Vote((*voteStr == "lumos") ? Vote::eVote::lumos : Vote::eVote::nox));
                player->get().SetVoted(true);

                if (!GameTools::IsVoteSessionFinished())
                {
                    break;
                }

                BroadcastMessage("Tous les votes ont été collectés");

                ScheduleTask(3, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::vote_result);
                    this->OnMachineState(uuid, GameTracker::eStep::vote_result, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::vote_result:
            {
                GameTracker::eStep nextStep = GameTools::GetVoteResult();

                auto targetPlayer = GameTools::GetFocusedPlayer();
                std::string targetName = targetPlayer ? targetPlayer->get().GetName() : "le joueur";
                if (nextStep == GameTracker::eStep::vote_result_lumos || nextStep == GameTracker::eStep::vote_voldemort_elected)
                {
                    BroadcastMessage(fmt::format("{} est élu Directeur de Poudlard", targetName));
                    if (targetPlayer)
                    {
                        targetPlayer->get().SetDirector(true);
                        for (Player& player : GameStatus::GetInstance().GetPlayers())
                        {
                            player.SetFormerDirector(false);
                        }
                    }
                }
                else
                {
                    BroadcastMessage(fmt::format("{} n'a pas été élu Directeur de Poudlard", targetName));
                }

                ScheduleTask(6, [this, uuid, nextStep]() {
                    GameTools::VoteSession(false);
                    GameTools::ResetVoteSession();
                    GameStatus::GetInstance().GetGameTracker().Set(nextStep);
                    this->OnMachineState(uuid, nextStep, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::vote_voldemort_elected:
            {
                int popupTimeout = 8;
                auto voldemort = GameTools::GetVoldemort();
                std::string voldemortName = voldemort ? voldemort->get().GetName() : "un joueur inconnu";
                BroadcastPopup(fmt::format("{} est Voldemort, "
                    "en l'élisant Directeur de Poudlard les Mangemorts ont renversé le pouvoir, "
                    "les Mangemort l'emportent !", voldemortName), popupTimeout);

                if (voldemort)
                {
                    voldemort->get().SetDirector(true);
                }

                ScheduleTask(popupTimeout, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::game_finished);
                    this->OnMachineState(uuid, GameTracker::eStep::game_finished, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::vote_result_nox:
            {
                ScheduleTask(1, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::election_tracker_incremented);
                    this->OnMachineState(uuid, GameTracker::eStep::election_tracker_incremented, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::vote_result_lumos:
            {
                BroadcastMessage("Le Minstre de la magie doit piocher 3 cartes de loi");

                if (auto minister = GameTools::GetMinister())
                {
                    SendPopup(minister->get().GetUuid(), "Veuillez piocher 3 cartes de loi", 0);
                }

                SetInstantNextStep(GameTracker::eStep::minister_draw);
                break;
            }

            case GameTracker::eStep::minister_draw:
            {
                GameStatus::GetInstance().GetLaws().Draw();

                BroadcastMessage("Le Minstre de la magie doit défausser une carte de loi");
                SetInstantNextStep(GameTracker::eStep::minister_discard);
                break;
            }

            case GameTracker::eStep::minister_discard:
            {
                auto cardStr = GetData<std::string>(data, step);
                if (!cardStr)
                {
                    break;
                }
                Faction card(*cardStr);
                GameStatus::GetInstance().GetLaws().Discard(card);

                if (GameStatus::GetInstance().GetBoard().GetDeatheaterVoted() >= 5)
                {
                    BroadcastMessage("Le Directeur de Poudlard réfléchit à utiliser son droit de veto");
                    SetInstantNextStep(GameTracker::eStep::director_veto);
                }
                else
                {
                    BroadcastMessage("Le Directeur de Poudlard doit défausser une carte de loi");
                    SetInstantNextStep(GameTracker::eStep::director_discard);
                }
                break;
            }

            case GameTracker::eStep::director_veto:
            {
                auto veto = GetData<bool>(data, step);
                if (!veto)
                {
                    break;
                }
                if (*veto)
                {
                    BroadcastMessage("Le Directeur de Poudlard a demandé l'annulation du vote en cours");

                    SetInstantNextStep(GameTracker::eStep::minister_veto_response);
                }
                else
                {
                    BroadcastMessage("Le Directeur de Poudlard doit défausser une carte de loi");

                    SetInstantNextStep(GameTracker::eStep::director_discard);
                }
            }

            case GameTracker::eStep::director_discard:
            {
                auto cardStr = GetData<std::string>(data, step);
                if (!cardStr)
                {
                    break;
                }
                Faction card(*cardStr);
                GameStatus::GetInstance().GetLaws().Discard(card);

                BroadcastMessage("Le Directeur de Poudlard a défaussé une carte, une loi va être votée");

                SetInstantNextStep(GameTracker::eStep::law_voted);

                ScheduleTask(2, [this, uuid]() {
                    this->OnMachineState(uuid, GameTracker::eStep::law_voted, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::minister_veto_response:
            {
                auto acceptRequest = GetData<bool>(data, step);
                if (!acceptRequest)
                {
                    break;
                }
                if (*acceptRequest)
                {
                    int popupTimeout = 5;
                    BroadcastMessage("Le trackeur d'élection va être incrémenté...");
                    BroadcastPopup("Le Ministre a accédé à la requête de veto du Directeur de Poudlard, le vote en cours en abandonné", popupTimeout);

                    SetInstantNextStep(GameTracker::eStep::veto_accepted);

                    ScheduleTask(popupTimeout, [this, uuid]() {
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::election_tracker_incremented);
                        this->OnMachineState(uuid, GameTracker::eStep::election_tracker_incremented, std::monostate{});
                    });
                }
                else
                {
                    BroadcastMessage("Le Directeur de Poudlard doit défausser une carte de loi");
                    BroadcastPopup("Le Ministre n'a pas souhaité accéder à la requête de veto du Directeur, le vote continue", 5);
                    
                    SetInstantNextStep(GameTracker::eStep::director_discard);
                }
                break;
            }

            case GameTracker::veto_accepted:
            {
                // nothing to do
                break;
            }

            case GameTracker::eStep::election_tracker_incremented:
            {
                GameStatus::GetInstance().SetElectionTracker(GameStatus::GetInstance().GetElectionTracker() + 1);

                GameTracker::eStep nextStep = GameTracker::eStep::end_of_turn;
                int electionTracker = GameStatus::GetInstance().GetElectionTracker();
                if (electionTracker >= 3)
                {
                    nextStep = GameTracker::eStep::ministry_enter_chaos;
                }

                BroadcastMessage(fmt::format("Le traqueur d'élection passe à {}", electionTracker));

                ScheduleTask(3, [this, uuid, nextStep]() {
                    GameStatus::GetInstance().GetGameTracker().Set(nextStep);
                    this->OnMachineState(uuid, nextStep, std::monostate{});
                });

                break;
            }

            case GameTracker::eStep::ministry_enter_chaos:
            {
                m_chaosFlag = true;

                int popupTimeout = 5;
                BroadcastPopup("Le traqueur d'élection a atteint 3, le Ministère de la magie entre dans le chaos !", popupTimeout);

                ScheduleTask(popupTimeout, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::law_on_top_of_the_pile_voted);
                    this->OnMachineState(uuid, GameTracker::eStep::law_on_top_of_the_pile_voted, std::monostate{});
                });

                break;
            }

            case GameTracker::eStep::law_on_top_of_the_pile_voted:
            {
                Faction card = GameStatus::GetInstance().GetLaws().VoteLawTopStack();
                Power power = GameStatus::GetInstance().GetBoard().VoteLaw(card);

                GameStatus::GetInstance().SetElectionTracker(0);

                BroadcastMessage(fmt::format("Loi {} votée provenant du dessus de la pile, les pouvoirs seront ignorés", (card == Faction::deatheater) ? "mangemort" : "de l'ordre du phénix"));

                ScheduleTask(3, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::everyone_can_be_next_director);
                    this->OnMachineState(uuid, GameTracker::eStep::everyone_can_be_next_director, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::everyone_can_be_next_director:
            {
                BroadcastMessage("Au prochain tour, tout le monde sera éligible au poste de Directeur de Poudlard");

                ScheduleTask(3, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::end_of_turn);
                    this->OnMachineState(uuid, GameTracker::eStep::end_of_turn, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::law_voted:
            {
                Faction card = GameStatus::GetInstance().GetLaws().VoteLawInHand();
                Power power = GameStatus::GetInstance().GetBoard().VoteLaw(card);

                GameStatus::GetInstance().SetElectionTracker(0);

                BroadcastMessage(fmt::format("Loi {} votée", (card == Faction::deatheater) ? "mangemort" : "de l'ordre du phénix"));

                GameTracker::eStep nextStep = GameTracker::eStep::end_of_turn;
                switch (power.Get())
                {
                case Power::ePower::divination:
                    nextStep = GameTracker::eStep::trigger_power_divination;
                    break;
                
                case Power::ePower::endoloris:
                    nextStep = GameTracker::eStep::trigger_power_endoloris;
                    break;

                case Power::ePower::impero:
                    nextStep = GameTracker::eStep::trigger_power_impero;
                    break;

                case Power::ePower::avada_kedavra:
                    nextStep = GameTracker::eStep::trigger_power_avada_kedavra;
                    break;

                default:
                    break;
                }

                ScheduleTask(4, [this, uuid, nextStep]() {
                    GameStatus::GetInstance().GetGameTracker().Set(nextStep);
                    this->OnMachineState(uuid, nextStep, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::trigger_power_avada_kedavra:
            {
                BroadcastMessage("Le Ministre de la magie a le pouvoir de tuer un joueur");

                BroadcastPopup("Pouvoir 'Avada Kedavra' activé, le Ministre de la magie doit assassiner un joueur", 5);
                if (auto player = GameTools::GetMinister())
                {
                    SendPopup(player->get().GetUuid(), "Pouvoir 'Avada Kedavra' activé, assassinez un joueur", 0, "avada_kedavra.png");
                }

                SetInstantNextStep(GameTracker::eStep::player_to_kill_selection);
                break;
            }

            case GameTracker::eStep::player_to_kill_selection:
            {
                auto playerUuid = GetData<std::string>(data, step);
                if (!playerUuid)
                {
                    break;
                }
                if (auto player = GameStatus::GetInstance().GetPlayer(*playerUuid))
                {
                    LOG_INFO("{} has been killed", player->get().GetName());
                    player->get().SetDead(true);

                    BroadcastMessage(fmt::format("{} a été assassiné", player->get().GetName()));

                    int popupTimeout = 4;
                    BroadcastPopup(fmt::format("{} a été assassiné par le Ministre de la magie", player->get().GetName()), popupTimeout);

                    if (player->get().GetRole() == Faction::roleVoldemort)
                    {
                        SetInstantNextStep(GameTracker::eStep::voldemort_assassinated);
                        
                        int secondPopupTimeout = 8;
                        ScheduleTask(popupTimeout, [this, uuid, secondPopupTimeout]() {
                            BroadcastPopup("Voldemort a été assassiné, l'ordre du phénix a gagné !", secondPopupTimeout);
                            GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::game_finished);
                            this->OnMachineState(uuid, GameTracker::eStep::game_finished, std::monostate{});
                        });
                    }
                    else
                    {
                        SetInstantNextStep(GameTracker::eStep::end_of_turn);
                        
                        ScheduleTask(popupTimeout, [this, uuid]() {
                            GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::end_of_turn);
                            this->OnMachineState(uuid, GameTracker::eStep::end_of_turn, std::monostate{});
                        });
                    }
                }
                break;
            }

            case GameTracker::eStep::player_killed:
            {
                // nothing to do
                break;
            }

            case GameTracker::eStep::voldemort_assassinated:
            {
                // nothing to do
                break;
            }

            case GameTracker::eStep::trigger_power_endoloris:
            {
                BroadcastMessage("Le Ministre de la magie a le pouvoir de regarder la faction d'un joueur");

                BroadcastPopup("Pouvoir 'Endoloris' activé, le Ministre de la magie doit regarder la faction d'un joueur", 5);
                if (auto player = GameTools::GetMinister())
                {
                    SendPopup(player->get().GetUuid(), "Pouvoir 'Endoloris' activé, choississez un joueur pour voir sa faction", 0, "endoloris.png");
                }

                SetInstantNextStep(GameTracker::eStep::spying_player_selection);
                break;
            }

            case GameTracker::eStep::spying_player_selection:
            {
                auto playerUuid = GetData<std::string>(data, step);
                if (!playerUuid)
                {
                    break;
                }
                if (auto player = GameStatus::GetInstance().GetPlayer(*playerUuid))
                {
                    LOG_INFO("{} has been selected for spying", player->get().GetName());
                    Faction faction = player->get().GetFaction();

                    BroadcastMessage(fmt::format("{} est en train d'être espionné par le Ministre de la magie", player->get().GetName()));

                    int popupTimeout = 6;
                    SendPopup(uuid, fmt::format("{} appartient à la faction {}",
                        player->get().GetName(),
                        (faction.Get() == Faction::eFaction::deatheater) ? "des mangemorts" : "de l'ordre du phénix"),
                        popupTimeout,
                        fmt::format("faction_{}.png", faction.ToString())
                    );

                    SetInstantNextStep(GameTracker::eStep::player_spying);

                    ScheduleTask(popupTimeout, [this, uuid]() {
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::end_of_turn);
                        this->OnMachineState(uuid, GameTracker::eStep::end_of_turn, std::monostate{});
                    });
                }
                break;
            }

            case GameTracker::eStep::player_spying:
            {
                // nothing to do
                break;
            }

            case GameTracker::eStep::trigger_power_divination:
            {
                BroadcastMessage("Le Ministre de la magie a le pouvoir de regarder les 3 cartes du dessus de la pile");

                int popupTimeout = 5;
                BroadcastPopup("Pouvoir 'Divination' activé, le Ministre de la magie doit regarder les 3 cartes du dessus de la pile", popupTimeout);
                if (auto player = GameTools::GetMinister())
                {
                    SendPopup(player->get().GetUuid(), "Pouvoir 'Divination' activé, vous allez pouvoir voir les 3 cartes de loi du dessus de la pile", popupTimeout, "divination.png");
                }

                ScheduleTask(popupTimeout, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::minister_check_top_cards);
                    this->OnMachineState(uuid, GameTracker::eStep::minister_check_top_cards, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::minister_check_top_cards:
            {
                ScheduleTask(5, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::end_of_turn);
                    this->OnMachineState(uuid, GameTracker::eStep::end_of_turn, std::monostate{});
                });
                break;
            }

            case GameTracker::eStep::trigger_power_impero:
            {
                BroadcastMessage("Le Ministre de la magie a le pouvoir de sélectionner le Minstre de la magie pour le prochain tour");

                BroadcastPopup("Pouvoir 'Impero' activé, le Ministre de la magie doit sélectionner le Ministre de la magie pour le prochain tour", 4);
                if (auto player = GameTools::GetMinister())
                {
                    SendPopup(player->get().GetUuid(), "Pouvoir 'Impero' activé, vous devez sélectionner le Ministre de la magie pour le prochain tour", 0, "impero.png");
                }

                SetInstantNextStep(GameTracker::eStep::next_minister_selection);
                break;
            }

            case GameTracker::eStep::next_minister_selection:
            {
                auto playerUuid = GetData<std::string>(data, step);
                if (!playerUuid)
                {
                    break;
                }
                if (auto nextMinister = GameStatus::GetInstance().GetPlayer(*playerUuid))
                {
                    if (auto normalNext = GameTools::GetNextMinister())
                        m_imperoPower.push_back(normalNext->get().GetUuid()); // next minister without power
                    m_imperoPower.push_back(nextMinister->get().GetUuid()); // next minister with power
                    LOG_INFO("{} has been selected to be next Minister", nextMinister->get().GetName());

                    BroadcastMessage(fmt::format("{} sera le Ministre pour le tour prochain", nextMinister->get().GetName()));

                    SetInstantNextStep(GameTracker::eStep::next_minister_selected);

                    ScheduleTask(3, [this, uuid]() {
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::end_of_turn);
                        this->OnMachineState(uuid, GameTracker::eStep::end_of_turn, std::monostate{});
                    });
                }
                break;
            }

            case GameTracker::eStep::next_minister_selected:
            {
                // nothing to do
                break;
            }

            case GameTracker::eStep::end_of_turn:
            {
                BroadcastMessage("Le tour est terminé");

                if (GameStatus::GetInstance().GetBoard().GetDeatheaterVoted() >= 6)
                {
                    ScheduleTask(2, [this, uuid]() {
                        BroadcastPopup("Les Mangemorts ont pris le contrôle du Ministère de la magie et l'emportent", 5);
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::game_finished);
                        this->OnMachineState(uuid, GameTracker::eStep::game_finished, std::monostate{});
                    });
                }
                else if (GameStatus::GetInstance().GetBoard().GetPhenixOrderVoted() >= 5)
                {
                    ScheduleTask(2, [this, uuid]() {
                        BroadcastPopup("L'Ordre du Phénix a pris le contrôle du Ministère de la magie et l'emporte", 5);
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::game_finished);
                        this->OnMachineState(uuid, GameTracker::eStep::game_finished, std::monostate{});
                    });
                }
                else
                {
                    ScheduleTask(2, [this, uuid]() {
                        GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::start_turn);
                        this->OnMachineState(uuid, GameTracker::eStep::start_turn, std::monostate{});
                    });
                }
                break;
            }

            case GameTracker::eStep::game_finished:
            {
                BroadcastMessage("La partie est terminé");

                ScheduleTask(60, [this, uuid]() {
                    GameStatus::GetInstance().GetGameTracker().Set(GameTracker::eStep::waiting_room);
                    this->OnMachineState(uuid, GameTracker::eStep::waiting_room, std::monostate{});
                });
                break;
            }

            default:
                LOG_ERROR("unknown state");
                break;
        }
    }
    catch (const std::bad_variant_access& e)
    {
        LOG_ERROR("Bad variant access in OnMachineState at step {} ({}): {}",
            step, GameTracker::ToString(static_cast<GameTracker::eStep>(step)), e.what());
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("Exception in OnMachineState at step {} ({}): {}",
            step, GameTracker::ToString(static_cast<GameTracker::eStep>(step)), e.what());
    }

    BroadCastGameStatus();
}

void GameController::SetInstantNextStep(GameTracker::eStep step)
{
    BroadCastGameStatus(); // propagate old state if not done
    GameStatus::GetInstance().GetGameTracker().Set(step);
}

void GameController::ScheduleTask(int delaySec, std::function<void()> task)
{
    BroadCastDelay(delaySec);

    int taskId = ++m_threadId;
    // The pointer must be captured here, from the uWS event loop thread
    // uWS::Loop::get() from a std::thread returns nullptr → crash
    uWS::Loop* loop = uWS::Loop::get();
    std::thread([this, loop, delaySec, task, taskId]()
    {
        std::this_thread::sleep_for(std::chrono::seconds(delaySec));
        if (m_shutdown.load())
        {
            return;
        }
        loop->defer([this, task, taskId]()
        {
            if (taskId == m_threadId.load())
            {
                task();
            }
        });
    }).detach();
}
