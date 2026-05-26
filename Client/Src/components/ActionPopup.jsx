import { useState } from 'react'
import { useGame }  from '../context/GameContext'
import { STEPS }    from '../constants/steps'
import { theme }    from '../theme'

import imgLumos          from '../../Ressources/lumos.png'
import imgNox            from '../../Ressources/nox.png'
import imgLawDeatheater  from '../../Ressources/law_deatheater.png'
import imgLawPhenixorder from '../../Ressources/law_phenixorder.png'
import imgVeto           from '../../Ressources/veto.png'

const LAW_IMAGES = {
  deatheater:  imgLawDeatheater,
  phenixorder: imgLawPhenixorder,
}
const LAW_LABELS = {
  deatheater:  'Mangemort',
  phenixorder: 'Ordre du Phénix',
}

// ── Common overlay ────────────────────────────────────────────────────────────
function Overlay({ children }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(0, 0, 0, 0.82)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      backdropFilter: 'blur(4px)',
      userSelect: 'none',
      cursor: 'default',
    }}>
      {children}
    </div>
  )
}

// ── Popup title ───────────────────────────────────────────────────────────────
function PopupTitle({ children }) {
  return (
    <p style={{
      color: theme.orange,
      fontFamily: 'Georgia, serif',
      fontSize: '3svh',
      textAlign: 'center',
      letterSpacing: '0.6px',
      margin: 0,
      textShadow: `0 0 20px ${theme.orange}66`,
    }}>
      {children}
    </p>
  )
}

// ── Vote panel (lumos / nox) ──────────────────────────────────────────────────
function VotePanel({ sendResponse, candidateName }) {
  const [hovered, setHovered] = useState(null) // 'lumos' | 'nox' | null
  const { playSound } = useGame()

  const handleVote = (vote) => {
    playSound('card')
    sendResponse({ vote })
  }

  const cardStyle = (key) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
    transform: hovered === key ? 'scale(1.06)' : 'scale(1.0)',
    transition: 'transform 0.15s ease, filter 0.15s ease',
    filter: hovered === key ? `drop-shadow(0 0 18px ${key === 'lumos' ? '#c9a84c' : '#6a6a8a'})` : 'none',
  })

  const imgStyle = {
    height: '30svh',
    borderRadius: '10px',
    border: `1px solid rgba(255,255,255,0.15)`,
    objectFit: 'cover',
    display: 'block',
    userSelect: 'none',
    pointerEvents: 'none',
  }

  const labelStyle = (key) => ({
    color: key === 'lumos' ? theme.orange : '#9090b0',
    fontFamily: 'Georgia, serif',
    fontSize: '2svh',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  })

  return (
    <>
      <PopupTitle>
        {candidateName
          ? `Votez pour l'élection de ${candidateName} au poste de Directeur de Poudlard`
          : 'Votez pour l\'élection du Directeur de Poudlard'}
      </PopupTitle>

      <div style={{ display: 'flex', gap: '5svw', alignItems: 'center' }}>

        <div
          style={cardStyle('lumos')}
          onMouseEnter={() => setHovered('lumos')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleVote('lumos')}
        >
          <img src={imgLumos} alt="Lumos" style={imgStyle} />
        </div>

        <div
          style={cardStyle('nox')}
          onMouseEnter={() => setHovered('nox')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleVote('nox')}
        >
          <img src={imgNox} alt="Nox" style={imgStyle} />
        </div>

      </div>
    </>
  )
}

// ── Veto panel (yes / no) ────────────────────────────────────────────────────
function VetoPanel({ title, sendResponse, drawnCards }) {
  const [hovered, setHovered] = useState(null)
  const { playSound } = useGame()

  const btnBase = {
    padding: '0.7rem 2.8rem',
    borderRadius: '6px',
    fontFamily: 'Georgia, serif',
    fontSize: '2.2svh',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease, transform 0.12s ease',
  }

  const btnOui = {
    ...btnBase,
    background: hovered === 'oui' ? theme.orange : 'transparent',
    color:      hovered === 'oui' ? theme.nearBlack : theme.orange,
    border: `1.5px solid ${theme.orange}`,
    transform:  hovered === 'oui' ? 'scale(1.05)' : 'scale(1.0)',
  }

  const btnNon = {
    ...btnBase,
    background: hovered === 'non' ? 'rgba(120,120,150,0.7)' : 'transparent',
    color:      hovered === 'non' ? '#eee' : '#9090b0',
    border: '1.5px solid #9090b0',
    transform:  hovered === 'non' ? 'scale(1.05)' : 'scale(1.0)',
  }

  return (
    <>
      {drawnCards?.length > 0 ? (
        <div style={{ display: 'flex', gap: '3svw', alignItems: 'center', marginBottom: '1svh' }}>
          {drawnCards.map((faction, i) => {
            const img   = LAW_IMAGES[faction]
            const label = LAW_LABELS[faction] ?? faction
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1svh' }}>
                <img
                  src={img}
                  alt={label}
                  draggable={false}
                  style={{
                    height: '28svh',
                    aspectRatio: '5 / 7',
                    borderRadius: '1svh',
                    objectFit: 'cover',
                    display: 'block',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    border: '0.2svh solid rgba(255,255,255,0.15)',
                  }}
                />
                <span style={{ color: '#aaa', fontFamily: 'Georgia, serif', fontSize: '2.2svh' }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <img
          src={imgVeto}
          alt="Veto"
          draggable={false}
          style={{
            height: '22svh',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      )}

      <PopupTitle>{title}</PopupTitle>

      <div style={{ display: 'flex', gap: '3rem' }}>
        <button
          style={btnOui}
          onMouseEnter={() => setHovered('oui')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => { playSound('card'); sendResponse({ veto: true }) }}
        >
          Oui
        </button>
        <button
          style={btnNon}
          onMouseEnter={() => setHovered('non')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => { playSound('card'); sendResponse({ veto: false }) }}
        >
          Non
        </button>
      </div>
    </>
  )
}

// ── Law discard panel (minister or director) ──────────────────────────────────
function LawDiscardPanel({ title, drawnCards, sendResponse }) {
  const [hovered, setHovered] = useState(null)
  const { playSound } = useGame()

  return (
    <>
      <PopupTitle>{title}</PopupTitle>

      <div style={{ display: 'flex', gap: '3svw', alignItems: 'center' }}>
        {drawnCards.map((faction, i) => {
          const img   = LAW_IMAGES[faction]
          const label = LAW_LABELS[faction] ?? faction
          const isHovered = hovered === i

          return (
            <div
              key={i}
              onClick={() => { playSound('card'); sendResponse({ law: faction }) }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1svh',
                cursor: 'pointer',
                transform: isHovered ? 'scale(1.07)' : 'scale(1.0)',
                transition: 'transform 0.15s ease, filter 0.15s ease',
                filter: isHovered ? `drop-shadow(0 0 18px ${theme.orange}aa)` : 'none',
              }}
            >
              <img
                src={img}
                alt={label}
                draggable={false}
                style={{
                  height: '30svh',
                  aspectRatio: '5 / 7',
                  borderRadius: '1svh',
                  border: `0.2svh solid ${isHovered ? theme.orange : 'rgba(255,255,255,0.15)'}`,
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: 'border 0.15s ease',
                }}
              />
              <span style={{
                color: isHovered ? theme.orange : '#aaa',
                fontFamily: 'Georgia, serif',
                fontSize: '2.2svh',
                letterSpacing: '0.8px',
                transition: 'color 0.15s ease',
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Divination panel (read-only view of the top 3 cards) ──────────────────────
function DivinationPanel({ topCards }) {
  return (
    <>
      <PopupTitle>Les 3 prochaines lois de la pioche</PopupTitle>
      <div style={{ display: 'flex', gap: '3svw', alignItems: 'center' }}>
        {topCards.map((faction, i) => {
          const img   = LAW_IMAGES[faction]
          const label = LAW_LABELS[faction] ?? faction
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1svh' }}>
              <img
                src={img}
                alt={label}
                draggable={false}
                style={{
                  height: '30svh',
                  aspectRatio: '5 / 7',
                  borderRadius: '1svh',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
              <span style={{ color: '#aaa', fontFamily: 'Georgia, serif', fontSize: '2.2svh' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ActionPopup() {
  const { me, gameStatus, sendResponse } = useGame()
  const stepId = gameStatus?.step?.id

  // Vote for the Director election
  if (me?.playing && !me?.dead && me?.election?.in_progress && !me?.election?.voted) {
    const candidate = gameStatus?.players?.find(p => p.election?.target)
    return (
      <Overlay>
        <VotePanel sendResponse={sendResponse} candidateName={candidate?.name} />
      </Overlay>
    )
  }

  // The Minister discards one card from the 3 drawn
  if (me?.minister && stepId === STEPS.minister_discard) {
    const drawn = gameStatus?.laws?.drawn ?? []
    return (
      <Overlay>
        <LawDiscardPanel
          title="Défaussez une carte de loi"
          drawnCards={drawn}
          sendResponse={sendResponse}
        />
      </Overlay>
    )
  }

  // The Director discards one card from the 2 remaining
  if (me?.director && stepId === STEPS.director_discard) {
    const drawn = gameStatus?.laws?.drawn ?? []
    return (
      <Overlay>
        <LawDiscardPanel
          title="Défaussez une carte de loi"
          drawnCards={drawn}
          sendResponse={sendResponse}
        />
      </Overlay>
    )
  }

  // The Director decides on a veto
  if (me?.director && stepId === STEPS.director_veto) {
    const drawn = gameStatus?.laws?.drawn ?? []
    return (
      <Overlay>
        <VetoPanel
          title="Souhaitez-vous demander un veto au Ministre de la magie ?"
          sendResponse={sendResponse}
          drawnCards={drawn}
        />
      </Overlay>
    )
  }

  // The Minister looks at the top 3 cards (divination)
  if (me?.minister && stepId === STEPS.minister_check_top_cards) {
    const stack    = gameStatus?.laws?.stack ?? []
    const topCards = stack.slice(-3).reverse()
    return (
      <Overlay>
        <DivinationPanel topCards={topCards} />
      </Overlay>
    )
  }

  // The Minister responds to the veto request
  if (me?.minister && stepId === STEPS.minister_veto_response) {
    return (
      <Overlay>
        <VetoPanel
          title="Le Directeur demande un veto. Acceptez-vous d'annuler le vote en cours ?"
          sendResponse={sendResponse}
        />
      </Overlay>
    )
  }

  return null
}
