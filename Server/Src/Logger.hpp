#pragma once

#include <fmt/core.h>
#include <fmt/ranges.h>
#include <iostream>

class Logger
{
public:
    template<typename... Args>
    static void Info(fmt::format_string<Args...> msg, Args&&... args)
    {
        std::cout << "[INFO] " << fmt::format(msg, std::forward<Args>(args)...) << "\n";
    }

    template<typename... Args>
    static void Warning(fmt::format_string<Args...> msg, Args&&... args)
    {
        std::cout << "[WARNING] " << fmt::format(msg, std::forward<Args>(args)...) << "\n";
    }

    template<typename... Args>
    static void Error(fmt::format_string<Args...> msg, Args&&... args)
    {
        std::cerr << "[ERROR] " << fmt::format(msg, std::forward<Args>(args)...) << "\n";
    }
};

#define LOG_INFO(...)    Logger::Info(__VA_ARGS__)
#define LOG_WARNING(...) Logger::Warning(__VA_ARGS__)
#define LOG_ERROR(...)   Logger::Error(__VA_ARGS__)
