import { useState } from 'react'
import { theme } from '../../theme'
import { STEPS } from '../../constants/steps'
import { useGame } from '../../context/GameContext'

/* Hauteur proportionnelle au viewport — facile à surcharger dans le layout mobile */
const CARD_HEIGHT = '8.8svh'

const ROLE_LABELS = {
  minister:     { label: 'Ministre',      bg: theme.orange,             text: '#111' },
  director:     { label: 'Directeur',     bg: 'rgba(255,255,255,0.15)', text: '#eee' },
  not_eligible: { label: 'Non éligible',  bg: 'rgba(255,255,255,0.06)', text: '#777' },
  spectator:    { label: 'Spectateur',    bg: 'rgba(180,140,100,0.18)', text: '#b8997a' },
}

const FACTION_LABELS = {
  voldemort:   { label: 'Voldemort',       bg: theme.navy,   text: '#c8d8f0' },
  deatheater:  { label: 'Mangemort',       bg: theme.violet, text: '#e8dded' },
  phenixorder: { label: "Ordre du Phénix", bg: theme.red,    text: '#f0d0d0' },
}

function getFactionConfig(player) {
  if (player.role?.toLowerCase() === 'voldemort') return FACTION_LABELS.voldemort
  return FACTION_LABELS[player.faction] ?? null
}

function RoleBadge({ type, cfg: cfgProp }) {
  const cfg = cfgProp ?? ROLE_LABELS[type]
  if (!cfg) return null
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.1svh 0.35rem',
      borderRadius: '3px',
      fontSize: '1.3svh',
      fontFamily: 'Georgia, serif',
      letterSpacing: '0.4px',
      background: cfg.bg,
      color: cfg.text,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

/**
 * onPlayerClick : callback(player) provided by the parent when an action is required.
 *                 null = no interaction expected on the list.
 */
function PlayerCard({ player, isMe, step, onPlayerClick }) {
  const [hovered, setHovered] = useState(false)
  const { playSound } = useGame()

  const isDead        = !!player.dead
  const isConnected   = !!player.connected
  const isPlaying     = !!player.playing
  const isMinister    = !!player.minister
  const isDirector    = !!player.director
  const isEligible    = step !== STEPS.director_election_begin || (!player.election?.former_director && !player.election?.former_minister)
  const isTarget      = !!player.election?.target
  const isSpectator   = !isPlaying
  const hasVoted      = !!player.election?.in_progress && !!player.election?.voted
  const isVoteResult  = step === STEPS.vote_result
  const showVoteBadge = hasVoted
  const voteColor     = isVoteResult ? (player.election?.vote === 'lumos' ? theme.lumos : player.election?.vote === 'nox' ? theme.red : theme.orange) : theme.orange
  const isClickable   = !!onPlayerClick && !isMe && !isSpectator && !isDead && isEligible

  let bg        = theme.darkBrown
  let nameColor = '#e0e0e0'
  if (isSpectator)             { bg = '#4a3828';       nameColor = '#b8997a' }
  if (isMinister)              { bg = theme.white;     nameColor = '#111' }
  if (isDirector)              { bg = theme.nearBlack; nameColor = '#ccc' }
  if (isDead && isConnected)   { bg = theme.darkRed;   nameColor = '#a05050' }

  let border
  if (isClickable && hovered)  border = `2px solid ${theme.orange}`
  else if (isTarget)           border = `2px solid ${theme.orange}`
  else if (isMe)               border = `1px solid ${theme.orange}66`
  else                         border = '1px solid rgba(255,255,255,0.07)'

  let transform
  if (onPlayerClick) {
    if (isClickable) transform = hovered ? 'scale(0.95)' : 'scale(0.9)'
    else             transform = 'scale(0.87)'
  } else {
    transform = 'scale(0.9)'
  }

  const opacity = !isConnected ? 0.4 : 1

  return (
    <div
      onMouseEnter={() => { setHovered(true); if (isClickable) playSound('hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={isClickable ? () => { playSound('click'); onPlayerClick(player) } : undefined}
      style={{
        height: CARD_HEIGHT,
        flexShrink: 0,
        padding: '0.5svh 0.65rem',
        borderRadius: '6px',
        background: bg,
        border,
        boxShadow: isClickable && hovered ? `0 0 10px ${theme.orange}66` : 'none',
        color: nameColor,
        cursor: isClickable ? 'pointer' : 'default',
        opacity,
        transform,
        transition: 'transform 0.15s ease, opacity 0.2s, box-shadow 0.15s ease, border 0.1s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.3svh',
        userSelect: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Indicateur de vote ── orange pendant le vote, vert/rouge à la révélation */}
      {showVoteBadge && (
        <div style={{
          position: 'absolute',
          top: '0.4svh',
          right: '0.4svh',
          width: '1.2svh',
          height: '1.2svh',
          borderRadius: '50%',
          background: voteColor,
          boxShadow: `0 0 6px ${voteColor}99`,
        }} />
      )}

      {/* Ligne 1 — Nom */}
      <span style={{
        fontSize: '1.8svh',
        fontFamily: 'Georgia, serif',
        fontWeight: isMe ? 'bold' : 'normal',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.2,
        textAlign: 'center',
        width: '100%',
      }}>
        {player.name || '(sans nom)'}
      </span>

      {/* Ligne 2 — Badges (hauteur réservée même si vide) */}
      <div style={{ height: '1.5svh', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        {step === STEPS.game_finished
          ? (() => { const cfg = getFactionConfig(player); return cfg && <RoleBadge cfg={cfg} /> })()
          : <>
              {isSpectator && <RoleBadge type="spectator" />}
              {!isSpectator && isMinister  && <RoleBadge type="minister" />}
              {!isSpectator && isDirector  && <RoleBadge type="director" />}
              {!isSpectator && !isMinister && !isEligible && <RoleBadge type="not_eligible" />}
            </>
        }
      </div>
    </div>
  )
}

/**
 * onPlayerClick : callback(player) to pass when an action on a player is required.
 *                 Leave as null/undefined otherwise (hover and cursor disabled).
 */
export default function PlayerList({ players, myUuid, step, onPlayerClick = null }) {
  return (
    <div className="scrollbar-players" style={{
      width: '20svw',
      flexShrink: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3svh',
      padding: '0.6rem 0.5rem',
      overflowY: 'auto',
    }}>
      {players.map(p => (
        <PlayerCard
          key={p.uuid}
          player={p}
          isMe={p.uuid === myUuid}
          step={step}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  )
}
