import { useState } from 'react'
import { theme } from '../../theme'

/* Import statique — Vite bundle les images et fournit l'URL correcte en dev et prod */
import imgAvadaKedavra from '../../../Ressources/power_avada_kedavra.png'
import imgDivination   from '../../../Ressources/power_divination.png'
import imgEndoloris    from '../../../Ressources/power_endoloris.png'
import imgImpero       from '../../../Ressources/power_impero.png'

const POWER_INFO = {
  avada_kedavra: {
    image: imgAvadaKedavra,
    label: 'Avada Kedavra',
    desc:  'Le Ministre de la magie élimine définitivement un joueur de votre choix.',
  },
  impero: {
    image: imgImpero,
    label: 'Imperio',
    desc:  "Le Ministre de la magie examine la carte de faction d'un joueur.",
  },
  divination: {
    image: imgDivination,
    label: 'Divination',
    desc:  'Le Ministre de la magie consulte les 3 prochaines lois de la pile.',
  },
  endoloris: {
    image: imgEndoloris,
    label: 'Endoloris',
    desc:  'Le Ministre de la magie désigne le prochain Ministre de la Magie.',
  },
}

function PowerSlot({ power, isUsed, isCurrent }) {
  const [hovered, setHovered] = useState(false)
  const info = POWER_INFO[power] ?? null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        height: '70%',
        maxHeight: '7svh',
        aspectRatio: '1 / 1',
        borderRadius: '6px',
        border: isCurrent
          ? `2px solid ${theme.orange}`
          : '2px solid rgba(255,255,255,0.12)',
        background: isUsed ? '#2a2a2a' : theme.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        flexShrink: 0,
        userSelect: 'none',
        cursor: 'default',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {info && (
        <img
          src={info.image}
          alt={info.label}
          draggable={false}
          style={{
            width: '95%',
            height: '95%',
            objectFit: 'contain',
            opacity: isUsed ? 0.35 : 1,
            filter: isUsed ? 'grayscale(1)' : 'none',
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        />
      )}

      {info && hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 0.8svh)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)',
          border: `1px solid ${theme.orange}66`,
          borderRadius: '6px',
          padding: '0.4rem 0.7rem',
          whiteSpace: 'nowrap',
          zIndex: 30,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          <p style={{ color: theme.orange, fontSize: '0.7rem', fontFamily: 'Georgia, serif', margin: '0 0 0.2rem 0', fontWeight: 'bold' }}>
            {info.label}
          </p>
          <p style={{ color: '#ccc', fontSize: '0.65rem', fontFamily: 'Georgia, serif', margin: 0 }}>
            {info.desc}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PowerTrack({ powers = [], deathEaterVoted = 0 }) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.4rem 1rem',
      userSelect: 'none',
      cursor: 'default',
      marginRight: '18svw',
    }}>
      {powers.map((power, i) => (
        <PowerSlot
          key={i}
          power={power}
          isUsed={i < deathEaterVoted}
          isCurrent={i === deathEaterVoted}
        />
      ))}
    </div>
  )
}
