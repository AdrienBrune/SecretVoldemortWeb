import { theme } from '../../theme'
import { useState } from 'react'

const styleSheet = document.head.appendChild(document.createElement("style"));
styleSheet.innerHTML = `
  @keyframes rotateColor {
    0% { filter: drop-shadow(0 0 4px ${theme.orange}); }
    50% { filter: drop-shadow(0 0 1px #00000088); }
    100% { filter: drop-shadow(0 0 4px ${theme.orange}); }
  }
`;

function ElectionTrackSlot({ active, text }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.4)' : active ? 'scale(1.3)' : 'scale(1)',
        opacity: active || isHovered ? 1 : 0.4,
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {/* Tooltip positionné en BAS */}
      <div style={{
        position: 'absolute',
        top: '140%',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        color: theme.white,
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '0.5rem',
        fontFamily: 'Courier New',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${active ? theme.orange : 'rgba(255,255,255,0.2)'}`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>
        {text}
        {/* Petite flèche du tooltip inversée */}
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '5px',
          borderStyle: 'solid',
          borderColor: `transparent transparent rgba(0, 0, 0, 0.85) transparent`
        }} />
      </div>

      {/* L'Étoile */}
      <span style={{
        color: active ? theme.orange : theme.white,
        fontSize: '2.8svh',
        lineHeight: 1,
        transition: 'color 0.3s ease',
        animation: isHovered ? 'rotateColor 1.5s linear infinite' : 'none',
      }}>
        ✦
      </span>
    </div>
  )
}

export default function ElectionTrack({ count }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: '0.8svh',
      userSelect: 'none',
      cursor: 'default',
    }}>
      {/* Conteneur des étoiles */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'row',
        gap: '2.5svh',
        zIndex: 2 
      }}>
        <ElectionTrackSlot active={count >= 1} text="Gouvernement non élu" />
        <ElectionTrackSlot active={count >= 2} text="Gouvernement non élu pour la seconde fois d'affilé" />
        <ElectionTrackSlot active={count >= 3} text="Gouvernement non élu pour la troisième fois d'affilé, la loi du dessus de la pile sera votée" />
      </div>
    </div>
  )
}