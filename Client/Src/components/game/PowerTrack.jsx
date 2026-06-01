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
    desc:  'Le Ministre de la magie élimine définitivement un joueur de votre choix',
  },
  impero: {
    image: imgImpero,
    label: 'Imperio',
    desc:  "Le Ministre de la magie examine la carte de faction d'un joueur",
  },
  divination: {
    image: imgDivination,
    label: 'Divination',
    desc:  'Le Ministre de la magie consulte les 3 prochaines lois de la pile',
  },
  endoloris: {
    image: imgEndoloris,
    label: 'Endoloris',
    desc:  'Le Ministre de la magie désigne le prochain Ministre de la Magie',
  },
}

// Injection d'une classe CSS globale pour gérer le zoom fluide et l'affichage du tooltip proprement
const hoverStyles = `
  .power-slot-container {
    transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s, background 0.2s !important;
  }
  /* Zoom de la box sans impacter les voisins */
  .power-slot-container:hover {
    transform: scale(1.08);
    z-index: 10;
  }
  /* Affichage du tooltip uniquement au survol */
  .power-slot-container:hover .power-tooltip {
    opacity: 1 !important;
    visibility: visible !important;
    transform: translateX(-50%) translateY(0) !important;
  }
`;

function PowerSlot({ power, isUsed, isCurrent }) {
  const info = POWER_INFO[power] ?? null

  return (
    <div
      className="power-slot-container"
      style={{
        position: 'relative',
        height: '70%',
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
      }}
    >
      <style>{hoverStyles}</style>

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

      {info && (
        <div 
          className="power-tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 0.8svh)',
            left: '50%',
            transform: 'translateX(-50%) translateY(4px)', 
            background: 'rgba(0,0,0,0.95)',
            border: `1px solid ${theme.orange}66`,
            borderRadius: '6px',
            padding: '0.4rem 0.7rem',
            whiteSpace: 'nowrap',
            zIndex: 30,
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: 0,
            visibility: 'hidden',
            transition: 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s',
          }}
        >
          <p style={{ color: theme.orange, fontSize: '0.7rem', fontFamily: 'Courier New', margin: '0 0 0.2rem 0', fontWeight: 'bold' }}>
            {info.label}
          </p>
          <p style={{ color: '#ccc', fontSize: '0.65rem', fontFamily: 'Courier New', margin: 0 }}>
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
      userSelect: 'none',
      cursor: 'default',
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