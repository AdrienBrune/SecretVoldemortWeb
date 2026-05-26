#include <GameTools.hpp>
#include <Logger.hpp>
#include <random.hpp>
#include <vector>


void GameTools::StartNewTurn(bool& chaos, std::vector<std::string>& imperoPower)
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();

    // reset players eligibility
    for (Player& player : players)
    {
        player.SetFormerMinister(false);
        player.SetFormerDirector(false);
    }

    // set former director
    auto it_dir = std::find_if(players.begin(), players.end(), [](const Player& p) {
        return p.GetDirector();
    });
    if (it_dir != players.end())
    {
        it_dir->SetDirector(false);
        it_dir->SetFormerDirector(chaos ? false : true);
    }

    // set former minister
    auto it_min = std::find_if(players.begin(), players.end(), [](const Player& p) {
        return p.GetMinister();
    });
    if (it_min != players.end())
    {
        it_min->SetMinister(false);
        if (GetNumberOfPlayingPlayer() > 5)
        {
            it_min->SetFormerMinister(chaos ? false : true);
        }
    }
    chaos = false;

    // Set next minister
    if (imperoPower.empty())
    {
        auto nextIt = it_min;
        bool found = false;
        for (size_t i = 0; i < players.size(); ++i)
        {
            nextIt = std::next(nextIt);
            if (nextIt == players.end())
            {
                nextIt = players.begin();
            }

            if (nextIt->GetPlaying() && !nextIt->GetDead())
            {
                nextIt->SetMinister(true);
                found = true;
                break;
            }
        }
        if (!found)
        {
            LOG_WARNING("StartNewTurn: no eligible player found to become minister");
        }
    }
    else
    {
        // Impero power in progress
        std::string targetUuid = imperoPower.back();
        imperoPower.pop_back();

        auto target = GameStatus::GetInstance().GetPlayer(targetUuid);
        if (target && !target->get().GetDead())
        {
            target->get().SetMinister(true);
        }
        else
        {
            // Designated minister is dead or not found — clear the stack and fall back to normal rotation
            imperoPower.clear();
            auto nextIt = it_min;
            for (size_t i = 0; i < players.size(); ++i)
            {
                nextIt = std::next(nextIt);
                if (nextIt == players.end())
                {
                    nextIt = players.begin();
                }
                if (nextIt->GetPlaying() && !nextIt->GetDead())
                {
                    nextIt->SetMinister(true);
                    break;
                }
            }
        }
    }
    
}

void GameTools::ResetVoteSession()
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        player.SetTarget(false);
        player.SetVote(Vote::eVote::none);
        player.SetVoted(false);
    }
}

bool GameTools::IsVoteSessionFinished()
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        if (!player.GetDead() && player.GetPlaying())
        {
            if (!player.GetVoted())
            {
                return false;
            }
        }
    }
    return true;
}

void GameTools::VoteSession(bool enable)
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        player.SetInProgress(enable);
    }
}

GameTracker::eStep GameTools::GetVoteResult()
{
    int voteBalance = 0;

    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();
    for (Player& player : players)
    {
        if (player.GetVoted())
        {
            voteBalance = (player.GetVote() == Vote::eVote::nox) ? voteBalance - 1 : voteBalance + 1;
        }
    }
    
    // nox result
    if (voteBalance <= 0)
    {
        return GameTracker::eStep::vote_result_nox;
    }

    // lumos result
    if (auto voldemort = GetVoldemort())
    {
        if (voldemort->get().GetTarget() && GameStatus::GetInstance().GetBoard().GetDeatheaterVoted() >= 3)
        {
            return GameTracker::eStep::vote_voldemort_elected;
        }
    }
    return GameTracker::eStep::vote_result_lumos;
}

std::optional<std::reference_wrapper<Player>> GameTools::GetNextMinister()
{
    std::vector<Player>& players = GameStatus::GetInstance().GetPlayers();

    auto it = std::find_if(players.begin(), players.end(), [](const Player& p) { return p.GetMinister(); });
    if (it != players.end())
    {
        auto nextIt = it;
        for (size_t i = 0; i < players.size(); ++i)
        {
            nextIt = std::next(nextIt);
            if (nextIt == players.end())
            {
                nextIt = players.begin();
            }
            if (nextIt->GetPlaying() && !nextIt->GetDead())
            {
                return *nextIt;
            }
        }
    }

    LOG_WARNING("next Minister not found among players");
    return std::nullopt;
}

bool GameTools::IsGameFinished()
{
    Board& board = GameStatus::GetInstance().GetBoard();

    if (board.GetDeatheaterVoted() >= 6 || board.GetPhenixOrderVoted() >= 5)
    {
        return true;
    }

    if (auto voldemort = GameTools::GetVoldemort())
    {
        if (voldemort->get().GetDirector())
        {
            return true;
        }
        if (voldemort->get().GetDead())
        {
            return true;
        }
    }

    return false;
}

std::optional<std::reference_wrapper<Player>> GameTools::GetMinister()
{
    for (Player& player : GameStatus::GetInstance().GetPlayers())
    {
        if (player.GetMinister())
        {
            return player;
        }
    }

    LOG_WARNING("Minister not found among players");
    return std::nullopt;
}

std::optional<std::reference_wrapper<Player>> GameTools::GetDirector()
{
    for (Player& player : GameStatus::GetInstance().GetPlayers())
    {
        if (player.GetDirector())
        {
            return player;
        }
    }

    LOG_WARNING("Director not found among players");
    return std::nullopt;
}

std::optional<std::reference_wrapper<Player>> GameTools::GetVoldemort()
{
    for (Player& player : GameStatus::GetInstance().GetPlayers())
    {
        if (player.GetRole() == Faction::roleVoldemort) 
        {
            return player;
        }
    }

    LOG_ERROR("Voldemort not found among players");
    return std::nullopt;
}

std::optional<std::reference_wrapper<Player>> GameTools::GetFocusedPlayer()
{
    for (Player& player : GameStatus::GetInstance().GetPlayers())
    {
        if (player.GetElection().GetTarget())
        {
            return player;
        }
    }

    LOG_WARNING("player focused not found among players");
    return std::nullopt;
}

int GameTools::GetNumberOfPlayingPlayer()
{
    int count = 0;
    for (Player& player : GameStatus::GetInstance().GetPlayers())
    {
        if (player.GetPlaying())
        {
            count++;
        }
    }

    if (count < 5)
    {
        LOG_ERROR("playing player count can't be less than 5");
    }

    return count;
}
