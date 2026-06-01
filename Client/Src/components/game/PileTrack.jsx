import { useState } from 'react'
import { theme } from '../../theme'
import { useGame } from '../../context/GameContext'
import { STEPS }   from '../../constants/steps'

const animationStyles = `
@keyframes animation_size {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}`;

/* ── Dos de carte générique ── */
function CardBack({ cardNumber, onDraw }) {
  const [hovered, setHovered] = useState(false)
  const clickable = !!onDraw

  return (
    <div 
      onClick={clickable ? onDraw : undefined}
      onMouseEnter={clickable ? () => setHovered(true)  : undefined}
      onMouseLeave={clickable ? () => setHovered(false) : undefined}
      style={{
      width: '100%',
      height: '100%',
      background: theme.nearBlack,
      borderRadius: '1.2svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      animation: clickable && !hovered ? 'animation_size 3s ease-in-out infinite' : 'none',
    }}>
      <style>{animationStyles}</style>

      {/* Bordure interne orange */}
      <div style={{ 
        position: 'absolute', 
        inset: '0.7svh', 
        border: `0.35svh solid ${theme.orange}96`, 
        borderRadius: '1svh' 
      }} />

      {/* Affichage du nombre de cartes */}
      {( cardNumber > 0 &&
      <span style={{
          color: theme.white,
          fontSize: '5svh',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '300',
          zIndex: 1,
          lineHeight: 1,
        }}>
          {cardNumber}
      </span>
      )}
    </div>
  )
}

/* ── Slot générique ── */
function CardSlot({ label, height, clickable, children }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div 
      onMouseEnter={clickable ? () => setHovered(true)  : undefined}
      onMouseLeave={clickable ? () => setHovered(false) : undefined}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5svh', height }}>
      {/* Label */}
      <span style={{
        fontSize: '2svh',
        color: clickable ? theme.orange : theme.white,
        fontFamily: 'Courier New',
        letterSpacing: '1px',
        flexShrink: 0,
        transition: 'color 0.15s ease',
      }}>
        {label}
      </span>

      {/* Zone de la carte */}
      <div style={{
          flex: 1,
          minHeight: 0,
          aspectRatio: '5 / 7',
          border: `1.5px dashed ${theme.white}`,
          borderRadius: '6px',
          overflow: 'visible',
          background: 'rgba(0,0,0,0.2)',
          cursor: clickable ? 'pointer' : 'default',
          boxShadow: clickable && hovered ? `0 0 16px ${theme.orange}66` : 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Composant principal ── */
export default function PileTrack({ board, laws }) {
  const { me, gameStatus, sendResponse } = useGame()

  const stackCount  = laws?.stack?.length ?? 0
  const discardCount = laws?.discard?.length ?? 0
  const slotHeight  = 'calc(50% - 0.4rem)'
  const onDraw = (me?.minister && gameStatus?.step?.id === STEPS.minister_draw)
    ? () => sendResponse({ draw: true })
    : null
  const clickable = !!onDraw

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      userSelect: 'none',
      cursor: 'default',
    }}>
      
      {/* Colonne : pioche + défausse */}
      <div style={{
        height: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0,
        aspectRatio: '2 / 3',
      }}>
        <CardSlot label="Pioche" height={slotHeight} clickable={clickable}>
          {stackCount > 0 && (
            <CardBack cardNumber={stackCount} onDraw={onDraw}/>
          )}
        </CardSlot>

        <CardSlot label="Défausse" height={slotHeight} clickable={null}>
          {discardCount > 0 && (
            <CardBack cardNumber={discardCount} onDraw={null}/>
          )}
        </CardSlot>
      </div>

    </div>
  )
}