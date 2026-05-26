#pragma once

#include <GameStatus.hpp>

class GameTools
{
public:
    static void StartNewTurn(bool& chaos, std::vector<std::string>& imperoPower);
    static void ResetVoteSession();
    static bool IsVoteSessionFinished();
    static void VoteSession(bool enable);
    static GameTracker::eStep GetVoteResult();
    static std::optional<std::reference_wrapper<Player>> GetNextMinister();
    static bool IsGameFinished();
    static std::optional<std::reference_wrapper<Player>> GetMinister();
    static std::optional<std::reference_wrapper<Player>> GetDirector();
    static std::optional<std::reference_wrapper<Player>> GetVoldemort();
    static std::optional<std::reference_wrapper<Player>> GetFocusedPlayer();
    static int GetNumberOfPlayingPlayer();
};
