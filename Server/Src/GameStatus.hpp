#pragma once

#include <string>
#include <vector>
#include <algorithm>
#include <array>
#include <optional>
#include <functional>
#include <nlohmann/json.hpp>
#include <Logger.hpp>
#include <random.hpp>

#define DEATHEATER_SLOTS 6
#define PHENIXORDER_SLOTS 5

class GameTracker
{
public:
    enum eStep 
    {
        waiting_room,

        start_game,
        quit_game,

        start_turn,

        director_selection,
        director_election_begin,
        vote_collection,
        vote_result,
        vote_voldemort_elected,
        vote_result_nox,
        vote_result_lumos,

        minister_draw,
        minister_discard,
        director_veto,
        director_discard,
        minister_veto_response,
        veto_accepted,

        election_tracker_incremented,
        ministry_enter_chaos,
        law_on_top_of_the_pile_voted,
        everyone_can_be_next_director,
        law_voted,

        trigger_power_avada_kedavra,
        player_to_kill_selection,
        player_killed,
        voldemort_assassinated,

        trigger_power_endoloris,
        spying_player_selection,
        player_spying,

        trigger_power_divination,
        minister_check_top_cards,

        trigger_power_impero,
        next_minister_selection,
        next_minister_selected,

        end_of_turn,

        game_finished
    };

    GameTracker(){}
    ~GameTracker() = default;

    inline eStep Get() { return m_step; }
    inline void Set(eStep value) { m_step = value; }
    inline bool operator==(const GameTracker& other) const { return m_step == other.m_step; }
    inline bool operator==(eStep value) const { return m_step == value; }

    inline static std::string ToString(eStep step)
    {
        switch (step)
        {
            case waiting_room: return "Waiting room";
            case start_game: return "Starting the game";
            case quit_game: return "Quit the game";
            case start_turn: return "Start of turn";
            case director_selection: return "Director selection by the Minister of Magic";
            case director_election_begin: return "Beginning of the Hogwarts Director election";
            case vote_collection: return "Votes being collected";
            case vote_result: return "Vote result";
            case vote_voldemort_elected: return "Voldemort has been elected Director";
            case vote_result_nox: return "The vote is rejected by the majority";
            case vote_result_lumos: return "The vote is accepted by the majority";
            case minister_draw: return "The Minister draws the laws";
            case minister_discard: return "The Minister discards a law";
            case director_veto: return "The Hogwarts Director considers using their veto";
            case director_discard: return "The Director discards a law";
            case minister_veto_response: return "The Minister responds to the veto";
            case election_tracker_incremented: return "The election tracker advances";
            case ministry_enter_chaos: return "The Ministry falls into chaos";
            case law_on_top_of_the_pile_voted: return "The law on top of the pile is voted";
            case everyone_can_be_next_director: return "Ineligibility lifted for the next turn";
            case law_voted: return "A law has been voted";
            case trigger_power_avada_kedavra: return "Power activated: Assassination";
            case player_to_kill_selection: return "Selection of the player to assassinate";
            case player_killed: return "Player assassinated";
            case voldemort_assassinated: return "A player has been assassinated";
            case trigger_power_endoloris: return "Power activated: Spying";
            case spying_player_selection: return "Selection of the player to spy on";
            case player_spying: return "Spying in progress";
            case trigger_power_divination: return "Power activated: Divination";
            case minister_check_top_cards: return "The Minister consults the upcoming laws";
            case trigger_power_impero: return "Power activated: Substitute Minister";
            case next_minister_selection: return "Selection of the next Minister";
            case next_minister_selected: return "The next Minister has been designated";
            case end_of_turn: return "End of turn";
            case game_finished: return "The game is over";
            default:
            {
                LOG_WARNING("unknown step: {}", static_cast<int>(step));
                return "Unknown step";
            }
        }
    }
    inline std::string ToString() const
    {
        return GameTracker::ToString(m_step);
    }

    nlohmann::json toJson() const
    {
        return {
            {"id", m_step},
            {"name", ToString()}
        };
    }

private:
    eStep m_step = eStep::waiting_room;
};

class Vote
{
public:
    enum eVote { none, lumos, nox };

    Vote(){}
    Vote(eVote value):
        m_vote(value)
    {}
    ~Vote() = default;

    inline eVote Get() { return m_vote; }
    inline void Set(eVote value) { m_vote = value; }
    inline bool operator==(const Vote& other) const { return m_vote == other.m_vote; }
    inline bool operator==(eVote value) const { return m_vote == value; }

    inline std::string ToString() const
    {
        switch (m_vote)
        {
            case eVote::none: return "none";
            case eVote::lumos: return "lumos";
            case eVote::nox: return "nox";
            default: return "unknown";
        }
    }
private:
    eVote m_vote = eVote::none;
};

class Faction
{
public:
    enum eFaction { deatheater, phenixorder };
    static inline const std::vector<std::string> rolesPhenix { 
        "Harry", "Albus", "Hermione", "Ron", "Neville", "Sirius" 
    };
    static inline const std::vector<std::string> rolesDeatheaters { 
        "Beatrix", "Drago", "Lucius" 
    };
    static inline const std::string roleVoldemort = "Voldemort";

    Faction(){}
    Faction(eFaction value):
        m_faction(value)
    {}
    Faction(std::string value):
        m_faction(value == "deatheater" ? deatheater : phenixorder)
    {}
    ~Faction() = default;

    inline eFaction Get() { return m_faction; }
    inline void Set(eFaction value) { m_faction = value; }
    inline bool operator==(const Faction& other) const { return m_faction == other.m_faction; }
    inline bool operator==(eFaction value) const { return m_faction == value; }

    inline static Faction GetFaction(std::string role)
    {
        if (std::find(rolesPhenix.begin(), rolesPhenix.end(), role) != rolesPhenix.end())
        {
            return Faction(eFaction::phenixorder);
        } 
        else if (std::find(rolesDeatheaters.begin(), rolesDeatheaters.end(), role) != rolesDeatheaters.end())
        {
            return Faction(eFaction::deatheater);
        }
        else if (roleVoldemort == role)
        {
            return Faction(eFaction::deatheater);
        }
        else
        {
            LOG_ERROR("role do not exist: {}", role);
            return Faction(eFaction::deatheater);
        }
    }

    inline std::string ToString() const
    {
        switch (m_faction)
        {
            case eFaction::deatheater: return "deatheater";
            case eFaction::phenixorder: return "phenixorder";
            default: return "unknown";
        }
    }
private:
    eFaction m_faction = eFaction::deatheater;
};

class Power
{
public:
    enum ePower { none, divination, endoloris, impero, avada_kedavra };

    Power(){}
    Power(ePower value):
        m_power(value)
    {}
    ~Power() = default;

    inline ePower Get() { return m_power; }
    inline void Set(ePower value) { m_power = value; }
    inline bool operator==(const Power& other) const { return m_power == other.m_power; }
    inline bool operator==(ePower value) const { return m_power == value; }

    inline std::string ToString() const
    {
        switch (m_power)
        {
            case ePower::none: return "none";
            case ePower::divination: return "divination";
            case ePower::endoloris: return "endoloris";
            case ePower::impero: return "impero";
            case ePower::avada_kedavra: return "avada_kedavra";
            default: return "unknown";
        }
    }
private:
    ePower m_power = ePower::none;
};

class Election
{
public:
    Election(){}
    ~Election() = default;

    inline bool GetEligible() const { return !m_formerDirector && !m_formerMinister; }
    inline void SetFormerDirector(bool value) { m_formerDirector = value; }
    inline void SetFormerMinister(bool value) { m_formerMinister = value; }
    inline bool GetTarget() const { return m_target; }
    inline void SetTarget(bool value) { m_target = value; }
    inline bool GetVoted() const { return m_voted; }
    inline void SetVoted(bool value) { m_voted = value; }
    inline Vote GetVote() const { return m_vote; }
    inline void SetVote(Vote value) { m_vote = value; }
    inline bool GetInProgress() const { return m_inProgress; }
    inline void SetInProgress(bool value) { m_inProgress = value; }

    nlohmann::json toJson() const
    {
        return {
            {"in_progress", m_inProgress},
            {"former_director", m_formerDirector},
            {"former_minister", m_formerMinister},
            {"target", m_target},
            {"voted", m_voted},
            {"vote", m_vote.ToString()}
        };
    }

private:
    bool m_inProgress = false;
    bool m_formerMinister = false;
    bool m_formerDirector = false;
    bool m_target = false;
    bool m_voted = false;
    Vote m_vote;
};


class Player
{
public:
    Player(){}
    Player(std::string uuid):
        m_uuid(uuid)
    {}
    ~Player() = default;

    inline const std::string& GetUuid() const { return m_uuid; }
    inline void SetUuid(std::string value) { m_uuid = value; }
    inline const std::string& GetName() const { return m_name; }
    inline void SetName(std::string value) { m_name = value; }
    inline bool GetDead() const { return m_dead; }
    inline void SetDead(bool value) { m_dead = value; }
    inline bool GetPlaying() const { return m_playing; }
    inline void SetPlaying(bool value) { m_playing = value; }
    inline bool GetConnected() const { return m_connected; }
    inline void SetConnected(bool value) { m_connected = value; }
    inline Faction GetFaction() const { return m_faction; }
    inline void SetFaction(Faction value) { m_faction = value; }
    inline const std::string& GetRole() const { return m_role; }
    inline void SetRole(std::string value) { m_role = value; }
    inline bool GetMinister() const { return m_minister; }
    inline void SetMinister(bool value) { m_minister = value; }
    inline bool GetDirector() const { return m_director; }
    inline void SetDirector(bool value) { m_director = value; }
    inline Election& GetElection() { return m_election; }
    inline void SetElection(Election election) { m_election = election; }

    inline bool GetEligible() const { return m_election.GetEligible(); }
    inline void SetFormerDirector(bool value) { m_election.SetFormerDirector(value); }
    inline void SetFormerMinister(bool value) { m_election.SetFormerMinister(value); }
    inline bool GetTarget() const { return m_election.GetTarget(); }
    inline void SetTarget(bool value) { m_election.SetTarget(value); }
    inline bool GetVoted() const { return m_election.GetVoted(); }
    inline void SetVoted(bool value) { m_election.SetVoted(value); }
    inline Vote GetVote() const { return m_election.GetVote(); }
    inline void SetVote(Vote value) { m_election.SetVote(value); }
    inline bool GetInProgress() const { return m_election.GetInProgress(); }
    inline void SetInProgress(bool value) { m_election.SetInProgress(value); }

    nlohmann::json toJson() const
    {
        return {
            {"uuid", m_uuid},
            {"name", m_name},
            {"faction", m_faction.ToString()},
            {"role", m_role},
            {"dead", m_dead},
            {"playing", m_playing},
            {"connected", m_connected},
            {"minister", m_minister},
            {"director", m_director},
            {"election", m_election.toJson()}
        };
    }

private:
    std::string m_uuid;
    std::string m_name;
    Faction m_faction;
    std::string m_role;
    bool m_dead = false;
    bool m_playing = false;
    bool m_connected = false;
    bool m_minister = false;
    bool m_director = false;
    Election m_election;
};


class Laws
{
public:
    Laws()
    {
        _Init();
    }
    ~Laws() = default;

    inline const std::vector<Faction>& GetStack() const { return m_stack; }
    inline const std::vector<Faction>& GetDrawn() const { return m_drawn; }
    inline const std::vector<Faction>& GetDiscard() const { return m_discard; }

    inline void Shuffle(bool init = false)
    {
        if (init)
        {
            _Init();
        }

        for (auto card : m_discard)
        {
            m_stack.push_back(card);
        }
        m_discard.clear();

        for (auto card : m_drawn)
        {
            m_stack.push_back(card);
        }
        m_drawn.clear();

        std::mt19937& rng = Random::GetSeed();
        std::shuffle(m_stack.begin(), m_stack.end(), rng);

        LOG_INFO("law cards shuffled");
        LOG_INFO("stack: {}, drawn: {}, discarded: {}", m_stack.size(), m_drawn.size(), m_discard.size());
    }

    inline void Draw()
    {
        if (m_stack.size() < 3)
        {
            Shuffle();
        }

        if (!m_drawn.empty())
        {
            LOG_ERROR("card drawn not empty");
            m_drawn.clear();
        }

        for (int i = 0; i < 3; ++i)
        {
            m_drawn.push_back(m_stack.back());
            m_stack.pop_back();
        }

        LOG_INFO("3 law cards drawn: [{}, {}, {}]", m_drawn[0].ToString(), m_drawn[1].ToString(), m_drawn[2].ToString());
        LOG_INFO("stack: {}, drawn: {}, discarded: {}", m_stack.size(), m_drawn.size(), m_discard.size());
    }

    inline void Discard(Faction card)
    {
        if (m_drawn.empty())
        {
            LOG_ERROR("no law card drawn, can't discard");
            return;
        }

        auto it = std::find(m_drawn.begin(), m_drawn.end(), card);
        if (it == m_drawn.end())
        {
            LOG_ERROR("law card not found");
            m_discard.push_back(m_drawn.back());
            m_drawn.pop_back();
            return;
        }

        LOG_INFO("law card discarded: {}", (*it).ToString());
        m_discard.push_back(*it);
        m_drawn.erase(it);

        LOG_INFO("stack: {}, drawn: {}, discarded: {}", m_stack.size(), m_drawn.size(), m_discard.size());
    }

    inline Faction VoteLawInHand()
    {
        if (m_drawn.empty())
        {
            LOG_ERROR("no card in hand to be voted");
            return Faction();
        }
        Faction card = m_drawn.back();
        m_drawn.clear();

        return card;
    }

    inline Faction VoteLawTopStack()
    {
        if (m_stack.empty())
        {
            LOG_ERROR("no card in stack to be voted");
            return Faction();
        }
        Faction card = m_stack.back();
        m_stack.pop_back();

        if (m_stack.size() < 3)
        {
            Shuffle();
        }

        return card;
    }

    nlohmann::json toJson() const
    {
        nlohmann::json stack = nlohmann::json::array();
        nlohmann::json drawn = nlohmann::json::array();
        nlohmann::json discard = nlohmann::json::array();

        for (auto card : m_stack)
        {
            stack.push_back(card.ToString());
        }
        for (auto card : m_drawn)
        {
            drawn.push_back(card.ToString());
        }
        for(auto card : m_discard)
        {
            discard.push_back(card.ToString());
        }

        return { {"stack", stack}, {"drawn", drawn}, {"discard", discard} };
    }

private:
    inline void _Init()
    {
        m_stack.clear();
        m_drawn.clear();
        m_discard.clear();

        for (int i = 0; i < 21; i++)
        {
            m_stack.push_back(Faction(Faction::eFaction::deatheater));
        }
        for (int i = 0; i < 10; i++)
        {
            m_stack.push_back(Faction(Faction::eFaction::phenixorder));
        }
    }

private:
    std::vector<Faction> m_stack;
    std::vector<Faction> m_drawn;
    std::vector<Faction> m_discard;
};


class Board
{
public:
    Board(){}
    ~Board() = default;

    inline int GetDeatheaterVoted() const { return m_deatheaterVoted; }
    inline void SetDeatheaterVoted(int value) { m_deatheaterVoted = value; }
    inline int GetPhenixOrderVoted() const { return m_phenixOrderVoted; }
    inline void SetPhenixOrderVoted(int value) { m_phenixOrderVoted = value; }
    inline const std::array<Power, DEATHEATER_SLOTS>& GetPowers() const { return m_powers; }

    inline void Init(int numberOfPlayers)
    {
        m_deatheaterVoted = 0;
        m_phenixOrderVoted = 0;

        _SetPowers(numberOfPlayers);
    }

    inline Power VoteLaw(Faction law)
    {
        LOG_INFO("law placed on board: {}", law.ToString());
        
        if (law.Get() == Faction::eFaction::deatheater)
        {
            m_deatheaterVoted = std::min(m_deatheaterVoted + 1, DEATHEATER_SLOTS);
            
            Power power = m_powers.at(m_deatheaterVoted - 1);
            LOG_INFO("power on this slot: {}", power.ToString());
            return power;
        }
        else
        {
            m_phenixOrderVoted = std::min(m_phenixOrderVoted + 1, PHENIXORDER_SLOTS);
            return Power::ePower::none;
        }
    }

    nlohmann::json toJson() const
    {
        nlohmann::json powers = nlohmann::json::array();
        for (auto power : m_powers)
        {
            powers.push_back(power.ToString());
        }

        return {
            {"deatheater", {{"voted", m_deatheaterVoted}}},
            {"phenixorder", {{"voted", m_phenixOrderVoted}}},
            {"powers", powers}
        };
    }

private:
    inline void _SetPowers(int numberOfPlayers)
    {
        if (numberOfPlayers >= 9)
        {
            m_powers = { Power::ePower::endoloris, Power::ePower::endoloris, Power::ePower::impero, Power::ePower::avada_kedavra, Power::ePower::avada_kedavra, Power::ePower::none };
        }
        else if (numberOfPlayers >= 7)
        {
            m_powers = { Power::ePower::none, Power::ePower::endoloris, Power::ePower::impero, Power::ePower::avada_kedavra, Power::ePower::avada_kedavra, Power::ePower::none };
        }
        else
        {
            m_powers = { Power::ePower::none, Power::ePower::none, Power::ePower::divination, Power::ePower::avada_kedavra, Power::ePower::avada_kedavra, Power::ePower::none };
        }
    }

private:
    int m_deatheaterVoted = 0;
    int m_phenixOrderVoted = 0;
    std::array<Power, DEATHEATER_SLOTS> m_powers;
};

class GameStatus
{
public:
    inline bool GetStarted() const { return m_started; }
    inline void SetStarted(bool value) { m_started = value; }
    inline Laws& GetLaws() { return m_laws; }
    inline Board& GetBoard() { return m_board; }
    inline int GetElectionTracker() const { return m_electionTracker; }
    inline void SetElectionTracker(int value) { m_electionTracker = value; }
    inline GameTracker& GetGameTracker() { return m_gameTracker; }
    inline std::vector<Player>& GetPlayers() { return m_players; }
    inline std::optional<std::reference_wrapper<Player>> GetPlayer(std::string uuid)
    {
        auto it = std::find_if(m_players.begin(), m_players.end(),
                                [&uuid](const auto& player){
                                    return player.GetUuid() == uuid;
                                }
                            );
        if (it == m_players.end())
        {
            LOG_ERROR("player with uuid={} not found", uuid);
            return std::nullopt;
        }

        return *it;
    }

    inline bool StartGame()
    {
        LOG_INFO("starting a game, initialization ...");

        _CleanPlayerList(); // remove unconnected clients from list

        LOG_INFO("{} player in the room", m_players.size());
        if (m_players.size() < 5)
        {
            LOG_WARNING("five players must be in a room before starting a game", m_players.size());
            return false;
        }
        if (m_players.size() > 10)
        {
            LOG_WARNING("a game can't be played with more than 10 players", m_players.size());
            return false;
        }

        if (m_started)
        {
            LOG_WARNING("can't start game, game already in progress");
            return false;
        }

        // prepare players
        for (auto& player : m_players)
        {
            player.SetDirector(false);
            player.SetMinister(false);
            player.SetDead(false);
            player.SetPlaying(true);
            player.SetElection(Election());
        }
        _AttributeRoles();

        int ministerIndex = Random::GetInt(0, m_players.size()-1);
        m_players.at(ministerIndex).SetMinister(true);

        // prepare board
        m_laws.Shuffle(true); // true to init
        m_electionTracker = 0;
        m_board.Init(m_players.size());

        return true;
    }

    inline void AddPlayer(const std::string& uuid)
    {
        for (auto& player : m_players)
        {
            if (player.GetUuid() == uuid)
            {
                player.SetConnected(true);
                return;
            }
        }

        Player newPlayer(uuid);
        newPlayer.SetConnected(true);
        m_players.push_back(newPlayer);
    }

    inline void RemovePlayer(const std::string& uuid)
    {
        auto it = std::find_if(m_players.begin(), m_players.end(), 
                                    [&uuid](const auto& player){
                                        return player.GetUuid() == uuid;
                                    }
                                );

        if (it == m_players.end())
        {
            LOG_ERROR("player with uuid={} not found", uuid);
            return;
        }

        if (m_started)
        {
            it->SetConnected(false); // allow player to reconnect later
        }
        else
        {
            m_players.erase(it);
        }
    }

    nlohmann::json toJson() const
    {
        nlohmann::json players = nlohmann::json::array();
        for (const auto& p : m_players)
        {
            players.push_back(p.toJson());
        }

        return {
            {"type", "game"},
            {"content", 
                {
                    {"started", m_started},
                    {"players", players},
                    {"election_tracker", m_electionTracker},
                    {"laws", m_laws.toJson()},
                    {"board", m_board.toJson()},
                    {"step", m_gameTracker.toJson()}
                }
            }
        };
    }

private:
    inline void _CleanPlayerList()
    {
        if (!m_started)
        {
            std::erase_if(m_players, 
                [](const auto& player) {
                    return !player.GetConnected(); // player can reconnect later
                }
            );
        }
    }

    inline void _AttributeRoles()
    {
        std::vector<std::string> poolPhenix = Faction::rolesPhenix;
        std::vector<std::string> poolDeatheaters = Faction::rolesDeatheaters;

        std::shuffle(m_players.begin(), m_players.end(), Random::gen);

        // faction pattern attribution
        std::vector<Faction::eFaction> pattern = {
            // voldemort (deatheater)
            Faction::eFaction::phenixorder,
            Faction::eFaction::deatheater,
            Faction::eFaction::phenixorder,
            Faction::eFaction::phenixorder,
            Faction::eFaction::phenixorder,
            Faction::eFaction::deatheater,
            Faction::eFaction::phenixorder, 
            Faction::eFaction::deatheater,
            Faction::eFaction::phenixorder
        };

        for (size_t i = 0; i < m_players.size(); ++i)
        {
            if (i == 0)
            {
                m_players[i].SetRole(Faction::roleVoldemort);
                m_players[i].SetFaction(Faction(Faction::eFaction::deatheater));
            } 
            else
            {
                auto& pool = (pattern[(i - 1) % pattern.size()] == Faction::eFaction::phenixorder) ? poolPhenix : poolDeatheaters;
                if (pool.empty())
                {
                    LOG_ERROR("role pool is empty");
                    continue;
                }

                int idx = Random::GetInt(0, pool.size() - 1);
                m_players[i].SetRole(pool[idx]);
                m_players[i].SetFaction(Faction::GetFaction(pool[idx]));
                pool.erase(pool.begin() + idx); // remove role for next loop
            }
        }
    }

private:
    bool m_started = false;
    std::vector<Player> m_players;
    Laws m_laws;
    Board m_board;
    int m_electionTracker;
    GameTracker m_gameTracker;

// Singleton implementation
public:
    inline static GameStatus& GetInstance()
    {
        static GameStatus instance;
        return instance;
    }
    GameStatus(const GameStatus&) = delete;
    void operator=(const GameStatus&) = delete;

private:
    GameStatus() = default;
};
