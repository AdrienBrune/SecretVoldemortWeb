import { useState } from 'react'
import { theme } from '../../theme'
import { useGame } from '../../context/GameContext'
import { STEPS }   from '../../constants/steps'

import imgLawDeatheater  from '../../../Ressources/law_deatheater.png'
import imgLawPhenixorder from '../../../Ressources/law_phenixorder.png'

const FACTIONS = {
  deatheater: {
    image: imgLawDeatheater,
    max:   6,
    color: theme.violet,
    label: 'Mangemort',
  },
  phenixorder: {
    image: imgLawPhenixorder,
    max:   5,
    color: theme.red,
    label: 'Ordre du Phénix',
  },
}

const animationStyles = `
  @keyframes activeLawGlow {
    0% { box-shadow: 0 0 2px var(--glow-color); filter: brightness(1); }
    50% { box-shadow: 0 0 12px var(--glow-color), 0 0 4px var(--glow-color); filter: brightness(1.4); }
    100% { box-shadow: 0 0 2px var(--glow-color); filter: brightness(1); }
  }

  @keyframes floatUpAndFade {
    0% {
      transform: translateY(0) translateX(0) scale(0.4);
      opacity: 0;
    }
    15% {
      /* L'opacité max de la particule est bridée par la variable --max-opacity */
      opacity: var(--max-opacity);
    }
    100% {
      transform: translateY(-150px) translateX(var(--drift)) scale(1.1);
      opacity: 0;
    }
  }

  @keyframes auraPulse {
    0% { filter: drop-shadow(0 0 var(--shadow-min) var(--glow-color)) brightness(1); }
    50% { filter: drop-shadow(0 0 var(--shadow-max) var(--glow-color)) brightness(calc(1 + var(--intensity) * 0.2)); }
    100% { filter: drop-shadow(0 0 var(--shadow-min) var(--glow-color)) brightness(1); }
  }
`;

/* ── Pile de lois votées ── */
function LawStack({ faction, voted }) {
  const cfg = FACTIONS[faction]
  
  const intensity = cfg.max > 0 ? voted / cfg.max : 0
  const particleCount = voted * (8 + voted * 1.5) 
  const maxOpacity = 0.2 + intensity * 0.8
  const shadowMin = `${1 + intensity * 4}px`
  const shadowMax = `${8 + intensity * 16}px`

  // Distribution et physique des particules
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const baseSize = 1 + intensity * 3.5 
    const size = `${baseSize + Math.random() * 3}px`
    const baseDuration = 4.5 - intensity * 2 // De 4.5s (lent/calme) à 2.5s (rapide/énergique)
    const duration = `${baseDuration + Math.random() * 1.5}s`

    return {
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${10 + Math.random() * 85}%`,
      delay: `${Math.random() * -5}s`,
      duration,
      size,
      drift: `${(Math.random() - 0.5) * (20 + intensity * 30)}px`,
    }
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      height: '100%',
      aspectRatio: '5 / 7',
    }}>

      <style>{animationStyles}</style>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: '0.4svw', flexShrink: 0 }}>
        {Array.from({ length: cfg.max }).map((_, i) => (
          <div key={i} style={{
            width: '1.5svw', height: '0.5svh', borderRadius: '2px',
            background: i < voted ? cfg.color : theme.white,
            transition: 'background 0.3s',
            '--glow-color': cfg.color, 
            animation: voted ? 'activeLawGlow 2.5s ease-in-out infinite' : 'none',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>

      {/* Wrapper de la carte */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <div style={{
          position: 'relative',
          height: '100%',
          aspectRatio: '5 / 7',
          borderRadius: '7px',
          '--glow-color': cfg.color,
          '--intensity': intensity,
          '--shadow-min': shadowMin,
          '--shadow-max': shadowMax,
          animation: voted > 0 ? 'auraPulse 3s ease-in-out infinite' : 'none',
          transition: 'all 0.5s ease',
        }}>
          
          {/* Conteneur global des particules */}
          {voted > 0 && (
            <div style={{
              position: 'absolute',
              top: '-15%',
              left: '-5%',
              width: '110%',
              height: '115%',
              zIndex: 2, 
              pointerEvents: 'none',
              mixBlendMode: 'screen',
              '--max-opacity': maxOpacity,
            }}>
              {particles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    top: p.top,
                    left: p.left,
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, #ffffff 30%, ${cfg.color} 80%, transparent 100%)`,
                    boxShadow: `0 0 ${1 + intensity * 4}px ${cfg.color}, 0 0 ${3 + intensity * 6}px ${cfg.color}`,
                    '--drift': p.drift,
                    animation: `floatUpAndFade ${p.duration} linear infinite`,
                    animationDelay: p.delay,
                  }}
                />
              ))}
            </div>
          )}

          {/* Conteneur de l'image de la carte */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '7px',
            boxShadow: `0 4px 18px ${cfg.color}44`,
          }}>
            <img src={cfg.image} alt={cfg.label} draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}

/* ── Composant principal ── */
export default function LawTrack({ board, laws }) {
  const { me, gameStatus, sendResponse } = useGame()

  const deathEaterVoted  = board?.deatheater?.voted  ?? 0
  const phenixOrderVoted = board?.phenixorder?.voted ?? 0
  const stackCount       = laws?.stack?.length        ?? 0
  const discardPile      = laws?.discard              ?? []

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      padding: '0.4rem 1rem',
      userSelect: 'none',
      cursor: 'default',
    }}>
      {/* Les deux piles de lois */}
      <div style={{ display: 'flex', gap: '1.5svw', height: '100%', alignItems: 'center' }}>
        <LawStack faction="deatheater"  voted={deathEaterVoted} />
        <LawStack faction="phenixorder" voted={phenixOrderVoted} />
      </div>
    </div>
  )
}