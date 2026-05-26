#pragma once
#include <random>

namespace Random
{
    inline std::random_device rd;
    inline std::mt19937 gen(rd());

    inline static int GetInt(int min, int max)
    {
        std::uniform_int_distribution<> dis(min, max);
        return dis(gen);
    }

    inline static std::mt19937& GetSeed()
    {
        return gen;
    }
}
