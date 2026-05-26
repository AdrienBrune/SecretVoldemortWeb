#pragma once

#include <App.h>
#include <unordered_map>
#include <nlohmann/json.hpp>
#include <fstream>
#include <sstream>
#include <Logger.hpp>
#include <random>

struct PerSocketData { std::string uuid; };
using WS = uWS::WebSocket<false, true, PerSocketData>;

class Server
{
public:
    Server(){}
    ~Server() = default;

    void Start(int port);
    void Send(const std::string& uuid, const nlohmann::json& msg);
    void Broadcast(const nlohmann::json& msg);

private:
    void _SetupRoutes(uWS::App& app);
    void _HandleWsMessage(WS* ws, std::string_view message);
    inline static std::string _GetMimeType(const std::string& path)
    {
        static const std::unordered_map<std::string, std::string> MIME_TYPES = {
            {".html",  "text/html; charset=utf-8"},
            {".js",    "application/javascript"},
            {".css",   "text/css"},
            {".png",   "image/png"},
            {".jpg",   "image/jpeg"},
            {".svg",   "image/svg+xml"},
            {".ico",   "image/x-icon"},
            {".json",  "application/json"},
            {".woff",  "font/woff"},
            {".woff2", "font/woff2"},
        };

        auto dot = path.rfind('.');
        if (dot != std::string::npos)
        {
            auto it = MIME_TYPES.find(path.substr(dot));
            if (it != MIME_TYPES.end())
            {
                return it->second;
            }
        }
        return "application/octet-stream";
    }

    inline static bool _ReadFile(const std::string& path, std::string& content)
    {
        std::ifstream file(path, std::ios::binary);
        if (!file)
        {
            return false;
        }

        content.assign(std::istreambuf_iterator<char>(file), {});
        return true;
    }

    inline static std::string _GenerateUUID()
    {
        LOG_INFO("generate new uuid for client");

        std::random_device rd;
        std::mt19937_64 gen(rd());
        std::uniform_int_distribution<uint64_t> dis;

        uint64_t hi = dis(gen);
        uint64_t lo = dis(gen);

        hi = (hi & 0xFFFFFFFFFFFF0FFFULL) | 0x0000000000004000ULL;
        lo = (lo & 0x3FFFFFFFFFFFFFFFULL) | 0x8000000000000000ULL;

        std::ostringstream ss;
        ss << std::hex << std::setfill('0')
        << std::setw(8)  << (hi >> 32)                    << '-'
        << std::setw(4)  << ((hi >> 16) & 0xFFFF)         << '-'
        << std::setw(4)  << (hi & 0xFFFF)                  << '-'
        << std::setw(4)  << (lo >> 48)                    << '-'
        << std::setw(12) << (lo & 0x0000FFFFFFFFFFFFULL);
        return ss.str();
    }

private:
    std::unordered_map<std::string, WS*> m_activeClients;
};