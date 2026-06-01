#pragma once
#include <nlohmann/json.hpp>
#include <string>
#include <variant>
#include <Logger.hpp>
#include <Server.hpp>
#include <GameStatus.hpp>

class GameController
{
// Singleton implemmentation
public:
    static GameController& GetInstance()
    {
        static GameController instance;
        return instance;
    }

    inline void Init(Server* server)
    {
        m_server = server;
        LOG_INFO("game controller server registered");
    }

    void SendMessage(const std::string& uuid, std::string message);
    void BroadcastMessage(std::string message);
    void SendPopup(const std::string& uuid, std::string message, int timeout, std::string image = "");
    void BroadcastPopup(std::string message, int timeout);
    void BroadCastDelay(int timeSeconds);
    void BroadCastChatboxMessage(const std::string& senderUuid, const std::string& message);
    void BroadCastGameStatus();

    // callbacks
    void OnCommand(const std::string& uuid, const nlohmann::json& message);
    void OnMessage(const std::string& uuid, const nlohmann::json& message);
    
    // machine state
    using ResponseData = std::variant<std::monostate, bool, int, std::string>;
    void CheckResponseValidity(const std::string& uuid, int step, nlohmann::json& object);
    void OnMachineState(const std::string& uuid, int step, const ResponseData& data = std::monostate{});
    void SetInstantNextStep(GameTracker::eStep step);
    void ScheduleTask(int delaySec, std::function<void()> task);
    inline void CancelPlannedTask()
    {
        m_threadId++;
    }

    inline void Shutdown()
    {
        m_shutdown = true;
        m_threadId++;
    }

    inline void SendException(std::string uuid, std::string message) // not used yet ...
    {
        if (!m_server)
        {
            LOG_ERROR("server not set");
        }

        nlohmann::json packet(
            {{
                "type", "exception",
                "content", 
                {
                    { "message", message }
                }
            }}
        );
        m_server->Send(uuid, packet);
    }

private:
    GameController() = default;

private:
    Server* m_server = nullptr;
    bool m_chaosFlag = false;
    bool m_firstTurn = true;
    std::vector<std::string> m_imperoPower; // UUIDs
    std::atomic<int>  m_threadId = 0;
    std::atomic<bool> m_shutdown = false;
};