cmake_minimum_required(VERSION 3.30)
project(SecretVoldemort VERSION 0.1.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

cmake_policy(SET CMP0135 NEW)

include(FetchContent)

# ── nlohmann/json (header-only) ───────────────────────────────────────────────
FetchContent_Declare(json
    URL      https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    URL_HASH SHA256=d6c65aca6b1ed68e7a182f4757257b107ae403032760ed6ef121c9d55e81757d
)
FetchContent_MakeAvailable(json)

# ── libuv (event loop cross-platform, remplace ASIO) ─────────────────────────
# Avantages : C pur, pas de Boost, supporte Windows/Linux/macOS nativement
set(LIBUV_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LIBUV_BUILD_BENCH OFF CACHE BOOL "" FORCE)
FetchContent_Declare(libuv
    GIT_REPOSITORY https://github.com/libuv/libuv.git
    GIT_TAG        v1.49.2
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(libuv)

# ── uSockets ──────────────────────────────────────────────────────────────────
FetchContent_Populate(usockets
    GIT_REPOSITORY https://github.com/uNetworking/uSockets.git
    GIT_TAG        v0.8.8
    GIT_SHALLOW    TRUE
)

# Backend libuv uniquement : libuv.c est un fichier C pur, sans Boost ni ASIO
file(GLOB USOCKETS_SOURCES
    ${usockets_SOURCE_DIR}/src/*.c
    ${usockets_SOURCE_DIR}/src/eventing/libuv.c
)

add_library(uSockets STATIC ${USOCKETS_SOURCES})
target_include_directories(uSockets PUBLIC
    ${usockets_SOURCE_DIR}/src
)
target_compile_definitions(uSockets PUBLIC
    LIBUS_USE_LIBUV
    LIBUS_NO_SSL
    _WIN32_WINNT=0x0601
)
if(WIN32)
    target_link_libraries(uSockets PUBLIC ws2_32 wsock32)
endif()
target_link_libraries(uSockets PUBLIC uv_a)

# ── uWebSockets (header-only) ─────────────────────────────────────────────────
FetchContent_Populate(uwebsockets
    GIT_REPOSITORY https://github.com/uNetworking/uWebSockets.git
    GIT_TAG        v20.65.0
    GIT_SHALLOW    TRUE
)

add_library(uWebSockets INTERFACE)
target_include_directories(uWebSockets INTERFACE
    ${uwebsockets_SOURCE_DIR}/src
)
target_compile_definitions(uWebSockets INTERFACE
    UWS_NO_ZLIB
    LIBUS_NO_SSL
    LIBUS_USE_LIBUV
    _WIN32_WINNT=0x0601
)
target_link_libraries(uWebSockets INTERFACE uSockets)

# ── Génération de Client/Src/constants/steps.js depuis GameStatus.hpp ────────
find_package(Python3 QUIET COMPONENTS Interpreter)
if(Python3_FOUND)
    add_custom_target(GenerateSteps
        COMMAND ${Python3_EXECUTABLE} "${CMAKE_CURRENT_SOURCE_DIR}/generate_steps.py"
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        COMMENT "Generation de steps.js depuis GameStatus.hpp..."
        DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/Server/Src/GameStatus.hpp"
                "${CMAKE_CURRENT_SOURCE_DIR}/generate_steps.py"
    )
else()
    message(WARNING "Python3 introuvable — steps.js ne sera pas regénéré automatiquement.")
endif()

# ── Serveur SecretVoldemort ───────────────────────────────────────────────────
set(SERVER_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/Server")

file(GLOB_RECURSE SERVER_SOURCES Server/Src/*.cpp)

add_executable(SecretVoldemortServer ${SERVER_SOURCES})

if(Python3_FOUND)
    add_dependencies(SecretVoldemortServer GenerateSteps)
endif()

target_include_directories(SecretVoldemortServer PRIVATE ${SERVER_ROOT}/Src)

FetchContent_Declare(fmt
    GIT_REPOSITORY https://github.com/fmtlib/fmt.git
    GIT_TAG 11.0.2
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(fmt)

target_link_libraries(SecretVoldemortServer PRIVATE
    uWebSockets
    nlohmann_json::nlohmann_json
    fmt::fmt
)

# ── Copie automatique dans Release/ après chaque build ───────────────────────
set(RELEASE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/Release")

add_custom_command(TARGET SecretVoldemortServer POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory "${RELEASE_DIR}"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_FILE:SecretVoldemortServer>
        "${RELEASE_DIR}/$<TARGET_FILE_NAME:SecretVoldemortServer>"
    COMMENT "Deploiement serveur dans Release/"
)

# ── Build React client + deploiement dans Release/www/ ───────────────────────
if(WIN32)
    find_program(NPM_CMD NAMES npm.cmd npm)
else()
    find_program(NPM_CMD NAMES npm)
endif()

if(NPM_CMD)
    add_custom_command(TARGET SecretVoldemortServer POST_BUILD
        COMMAND ${NPM_CMD} install
        COMMAND ${NPM_CMD} run build
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/Client"
        COMMENT "Build React client..."
    )
    add_custom_command(TARGET SecretVoldemortServer POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CMAKE_CURRENT_SOURCE_DIR}/Client/dist"
            "${RELEASE_DIR}/www"
        COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CMAKE_CURRENT_SOURCE_DIR}/Client/dist"
            "$<TARGET_FILE_DIR:SecretVoldemortServer>/www"
        COMMENT "Deploiement React dans Release/www/ et $<CONFIG>/www/"
    )
else()
    message(WARNING "npm introuvable — le client React ne sera pas compile automatiquement.")
endif()
