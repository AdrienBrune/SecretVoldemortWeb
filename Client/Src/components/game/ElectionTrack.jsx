import { theme } from '../../theme'

function ElectionTrackSlot({ active }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      transform: active ? 'scale(1.3)' : 'scale(1)',
      opacity: active ? 1 : 0.2,
    }}>
      <span style={{
        color: active ? theme.orange : theme.white,
        fontSize: '2.8svh',
        lineHeight: 1
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
      marginRight: '18svw',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: '0.8svh',
      userSelect: 'none',
      cursor: 'default',
    }}>
        {/* Label */}
        <span style={{
          color: theme.white,
          fontSize: '1.4svh',
          fontWeight: 'bold',
          letterSpacing: '1px',
          zIndex: 2
        }}>
          Traqueur d'élection
        </span>

        {/* Conteneur des étoiles (Horizontal) */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'row',
          gap: '1.5svh',
          zIndex: 2 
        }}>
          <ElectionTrackSlot active={count >= 1} />
          <ElectionTrackSlot active={count >= 2} />
          <ElectionTrackSlot active={count >= 3} />
        </div>
      </div>
  )
}