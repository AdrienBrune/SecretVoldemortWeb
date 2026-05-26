#include <Server.hpp>
#include <GameController.hpp>
#include <GameStatus.hpp>


void Server::Start(int port)
{
    uWS::App app;

    _SetupRoutes(app);

    app.listen(port, [port](auto* socket)
    {
        if (socket)
        {
            LOG_INFO("Server listening on port {}", port);
        }
        else
        {
            LOG_ERROR("Failed to listen on port {}", port);
        }
    }).run();

    GameController::GetInstance().Shutdown();
}

void Server::_SetupRoutes(uWS::App& app)
{
    app.ws<PerSocketData>("/ws",
        {
            .open = [this](WS* ws)
            {
                LOG_INFO("New connection awaiting identification...");
            },

            .message = [this](WS* ws, std::string_view message, uWS::OpCode)
            {
                _HandleWsMessage(ws, message);
            },

            .close = [this](WS* ws, int code, std::string_view)
            {
                std::string uuid = ws->getUserData()->uuid;
                if (!uuid.empty())
                {
                    m_activeClients.erase(uuid);
                    GameStatus::GetInstance().RemovePlayer(uuid);
                    LOG_INFO("Client {} disconnected", uuid);
                }
                Broadcast(GameStatus::GetInstance().toJson());
            }
        }
    );

    app.get("/*", [](auto* res, auto* req)
        {
            std::string url = std::string(req->getUrl());
            if (url == "/" || url.empty()) url = "/index.html";

            std::string filePath = "www" + url;
            std::string content;

            if (_ReadFile(filePath, content))
            {
                res->writeHeader("Content-Type", _GetMimeType(filePath));
                res->end(content);
            }
            else
            {
                if (_ReadFile("www/index.html", content))
                {
                    res->writeHeader("Content-Type", "text/html; charset=utf-8");
                    res->end(content);
                }
                else
                {
                    res->writeStatus("404 Not Found");
                    res->end("404 Not Found - www/ directory not found");
                }
            }
        }
    );
}

void Server::_HandleWsMessage(WS* ws, std::string_view raw)
{
    try
    {
        auto data = nlohmann::json::parse(raw);
        std::string type = data.value("type", "");

        if (type == "identify")
        {
            nlohmann::json content = data.at("content").get<nlohmann::json>();
            std::string uuid = content.value("uuid", "");
            if (uuid.empty())
            {
                uuid = _GenerateUUID();
            }

            ws->getUserData()->uuid = uuid;
            m_activeClients[uuid] = ws;

            GameStatus::GetInstance().AddPlayer(uuid);

            LOG_INFO("send uuid to client: {}", uuid);
            ws->send(nlohmann::json({
                {"type", "identify"},
                {"content", {{"uuid", uuid}}}
            }).dump(), uWS::OpCode::TEXT);

            Broadcast(GameStatus::GetInstance().toJson());
        }
        else if (type == "ping")
        {
            LOG_INFO("ping received from {}", ws->getUserData()->uuid);
        }
        else if (type == "response")
        {
            nlohmann::json content = data.at("content").get<nlohmann::json>();
            GameController::GetInstance().OnMessage(ws->getUserData()->uuid, content);
        }
        else if (type == "command")
        {
            nlohmann::json content = data.at("content").get<nlohmann::json>();
            GameController::GetInstance().OnCommand(ws->getUserData()->uuid, content);
        }
        else
        {
            LOG_ERROR("unknow json message:\n{}", data.dump());
        }
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("JSON Error: {}", e.what());
    }
}

void Server::Send(const std::string& uuid, const nlohmann::json& msg)
{
    if (m_activeClients.count(uuid))
    {
        m_activeClients[uuid]->send(msg.dump(), uWS::OpCode::TEXT);
    }
}

void Server::Broadcast(const nlohmann::json& msg)
{
    std::string payload = msg.dump();
    for (auto const& [uuid, socket] : m_activeClients)
    {
        socket->send(payload, uWS::OpCode::TEXT);
    }
}
