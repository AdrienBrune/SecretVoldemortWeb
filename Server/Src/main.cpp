#include <Server.hpp>
#include <GameController.hpp>
#include <Logger.hpp>

int main()
{
    LOG_INFO("Initializing Secret Voldemort Server...");

    try
    {
        Server server;
        GameController::GetInstance().Init(&server);
        server.Start(8080);
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("Fatal error in main: {}", e.what());
        return 1;
    }

    return 0;
}
