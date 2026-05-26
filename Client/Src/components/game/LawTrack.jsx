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
    color: "#b36dc7",
    label: 'Mangemort',
  },
  phenixorder: {
    image: imgLawPhenixorder,
    max:   5,
    color: "#cb3b45",
    label: 'Ordre du Phénix',
  },
}

/* ── Dos de carte pour la pioche ── */
function CardBack({ stackCount }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.nearBlack,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', inset: '0.7svh', border: `0.35svh solid ${theme.orange}96`, borderRadius: '1.2svh' }} />
      {stackCount > 0 && (
        <span style={{
          color: theme.white,
          fontSize: '5svh',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '300',
          zIndex: 1,
          lineHeight: 1,
        }}>
          {stackCount}
        </span>
      )}
    </div>
  )
}

/* ── Slot générique avec bordure pointillée ── */
function CardSlot({ label, height, onDraw, children }) {
  const [hovered, setHovered] = useState(false)
  const clickable = !!onDraw

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5svh',
        height,
      }}
    >
      <span style={{
        fontSize: '2svh',
        color: clickable ? theme.orange : theme.white,
        fontFamily: 'Georgia, serif',
        letterSpacing: '1px',
        flexShrink: 0,
        transition: 'color 0.15s ease',
      }}>
        {label}
      </span>
      <div
        onClick={clickable ? onDraw : undefined}
        onMouseEnter={clickable ? () => setHovered(true)  : undefined}
        onMouseLeave={clickable ? () => setHovered(false) : undefined}
        style={{
          flex: 1,
          minHeight: 0,
          aspectRatio: '5 / 7',
          border: clickable
            ? `1.5px solid ${hovered ? theme.orange : theme.orange + '88'}`
            : `1.5px dashed ${theme.white}`,
          borderRadius: '6px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)',
          cursor: clickable ? 'pointer' : 'default',
          transform: clickable && hovered ? 'scale(1.05)' : 'scale(1.0)',
          boxShadow: clickable && hovered ? `0 0 16px ${theme.orange}66` : 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Slot défausse ── */
function DiscardSlot({ height, discardPile }) {
  const count = discardPile.length

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5svh' }}>
      {/* Label */}
      <span style={{
        fontSize: '2svh',
        color: theme.white,
        fontFamily: 'Georgia, serif',
        letterSpacing: '1px',
        flexShrink: 0,
      }}>
        Défausse
      </span>

      {/* Dos de carte avec compteur (identique à la pioche) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        aspectRatio: '5 / 7',
        border: `1.5px dashed ${theme.white}`,
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {count > 0
          ? <CardBack stackCount={count} />
          : null
        }
      </div>
    </div>
  )
}


/* ── Pile de lois votées ── */
function LawStack({ faction, voted }) {
  const cfg = FACTIONS[faction]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      height: '100%',
      aspectRatio: '5 / 7',
    }}>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: '0.4svw', flexShrink: 0 }}>
        {Array.from({ length: cfg.max }).map((_, i) => (
          <div key={i} style={{
            width: '1.5svw', height: '0.5svh', borderRadius: '2px',
            background: i < voted ? cfg.color : theme.white,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/*
        Wrapper flex:1 sans largeur explicite.
        Son enfant (height:100% + aspectRatio) calcule sa largeur depuis sa hauteur :
        le wrapper hérite de cette largeur comme min-content → LawStack width = card width.
      */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{
          height: '100%',
          aspectRatio: '5 / 7',
          borderRadius: '7px',
          overflow: 'hidden',
          boxShadow: `0 4px 18px ${cfg.color}44`,
        }}>
          <img src={cfg.image} alt={cfg.label} draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
          />
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

  const slotHeight = 'calc(50% - 0.4rem)'

  // Draw pile only clickable for the Minister at step minister_draw
  const onDraw = (me?.minister && gameStatus?.step?.id === STEPS.minister_draw)
    ? () => sendResponse({ draw: true })
    : null

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      padding: '0.4rem 1rem',
      overflow: 'hidden',
      userSelect: 'none',
      cursor: 'default',
    }}>

      {/* Les deux piles de lois */}
      <div style={{ display: 'flex', gap: '1.5svw', height: '100%', alignItems: 'center' }}>
        <LawStack faction="deatheater"  voted={deathEaterVoted} />
        <LawStack faction="phenixorder" voted={phenixOrderVoted} />
      </div>

      {/* Colonne droite : pioche + défausse */}
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0,
        aspectRatio: '2 / 3',
      }}>
        <CardSlot label="Pioche" height={slotHeight} onDraw={onDraw}>
          <CardBack stackCount={stackCount} />
        </CardSlot>

        <DiscardSlot height={slotHeight} discardPile={discardPile} />
      </div>

    </div>
  )
}
