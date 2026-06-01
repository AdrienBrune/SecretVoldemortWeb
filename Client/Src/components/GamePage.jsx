import { useMemo }  from 'react'
import { useGame }  from '../context/GameContext'
import { STEPS }    from '../constants/steps'
import PlayerList   from './game/PlayerList'
import GameBoard    from './game/GameBoard'
import RolePanel    from './game/RolePanel'
import BottomBar    from './game/BottomBar'
import PopupOverlay from './PopupOverlay'
import ActionPopup  from './ActionPopup'
import Chatbox      from './game/Chatbox';

export default function GamePage({ onNavigate }) {
  const { gameStatus, me, myUuid, sendResponse } = useGame()

  /**
   * Computes the callback to pass to PlayerList based on the current step and the player's role.
   * null = no interaction required on the players.
   */
  const onPlayerClick = useMemo(() => {
    const stepId = gameStatus?.step?.id

    if ( me?.minister && stepId === STEPS.director_election_begin
      || me?.minister && stepId === STEPS.spying_player_selection
      || me?.minister && stepId === STEPS.player_to_kill_selection
      || me?.minister && stepId === STEPS.next_minister_selection
    ) {
      return (player) => {
        if (player.uuid === me.uuid) return
        sendResponse({ player: player.uuid })
      }
    }

    return null
  }, [me, gameStatus?.step?.id, sendResponse])

  return (
    <div style={{
      height: '100dvh',
      width: '100dvw',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
      cursor: 'default',
    }}>

      <Chatbox
        players={gameStatus?.players ?? []}
      />

      {/* ── Top : 75svh ── */}
      <div style={{ height: '75svh', display: 'flex' }}>

        <PlayerList
          players={gameStatus?.players ?? []}
          myUuid={myUuid}
          step={gameStatus?.step?.id}
          onPlayerClick={onPlayerClick}
        />

        <GameBoard
          board={gameStatus?.board}
          laws={gameStatus?.laws}
          electionTracker={gameStatus?.election_tracker ?? 0}
        />

        <RolePanel />

      </div>

      {/* ── Bottom : 25svh ── */}
      <BottomBar
        step={gameStatus?.step}
        onNavigate={onNavigate}
      />

      <PopupOverlay />
      <ActionPopup />

    </div>
  )
}
