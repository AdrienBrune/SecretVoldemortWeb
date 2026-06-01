import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { theme } from '../../theme'

import imgAlbus     from '../../../Ressources/role_Albus.png'
import imgBeatrix   from '../../../Ressources/role_Beatrix.png'
import imgDrago     from '../../../Ressources/role_Drago.png'
import imgHarry     from '../../../Ressources/role_Harry.png'
import imgHermione  from '../../../Ressources/role_Hermione.png'
import imgLucius    from '../../../Ressources/role_Lucius.png'
import imgNeville   from '../../../Ressources/role_Neville.png'
import imgRon       from '../../../Ressources/role_Ron.png'
import imgSirius    from '../../../Ressources/role_Sirius.png'
import imgVoldemort from '../../../Ressources/role_Voldemort.png'

const ROLE_IMAGES = {
  Albus:     imgAlbus,
  Beatrix:   imgBeatrix,
  Drago:     imgDrago,
  Harry:     imgHarry,
  Hermione:  imgHermione,
  Lucius:    imgLucius,
  Neville:   imgNeville,
  Ron:       imgRon,
  Sirius:    imgSirius,
  Voldemort: imgVoldemort,
}

/**
 * Returns the list of cards to display according to knowledge rules:
 *  - spectator (playing=false) → all players who have a role
 *  - phenixorder               → only their own role
 *  - deatheater ≤ 6p          → their role + all other death eaters (mutual knowledge)
 *  - deatheater > 6p          → their role + Voldemort (unless they ARE Voldemort)
 *  - Voldemort > 6p           → only their own role
 */
function buildVisibleCards(me, allPlayers) {
  if (!me) return []

  // Spectator: sees everyone
  if (!me.playing) {
    return allPlayers
      .filter(p => p.role)
      .map(p => ({ player: p, label: p.name, isMe: p.uuid === me.uuid }))
  }

  const myCard = { player: me, label: 'Vous', isMe: true }

  if (me.faction !== 'deatheater') {
    return [myCard]
  }

  const count = allPlayers.length
  const others = allPlayers.filter(p => p.uuid !== me.uuid)

  if (count <= 6) {
    const allies = others
      .filter(p => p.faction === 'deatheater' && p.role)
      .map(p => ({ player: p, label: p.name, isMe: false }))
    return [myCard, ...allies]
  }

  // > 6 players
  if (me.role !== 'Voldemort') {
    const voldemort = others.find(p => p.role === 'Voldemort')
    if (voldemort) return [myCard, { player: voldemort, label: voldemort.name, isMe: false }]
  }

  return [myCard]
}

/* ── Carte de rôle individuelle ── */
function RoleCard({ player, label, isMe }) {
  const img = ROLE_IMAGES[player.role]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.4svh',
      flexShrink: 0,
    }}>
      <div style={{
        height: isMe ? '22svh' : '15svh',
        aspectRatio: '5 / 7',
        borderRadius: '6px',
        overflow: 'hidden',
        border: isMe
          ? `2px solid ${theme.orange}`
          : '1px solid rgba(255,255,255,0.25)',
        boxShadow: isMe ? `0 0 14px ${theme.orange}44` : 'none',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        {img && (
          <img
            src={img}
            alt={player.role}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
      </div>

      <span style={{
        color: '#ddd',
        fontSize: '1.3svh',
        fontFamily: 'Georgia, serif',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '11svw',
      }}>
        {label}
      </span>

      <span style={{
        color: isMe ? theme.orange : theme.violet,
        fontSize: '1.1svh',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
      }}>
        {player.role}
      </span>
    </div>
  )
}

/* ── Séparateur ── */
function Divider({ label }) {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
      <span style={{
        color: 'rgba(255,255,255,0.35)',
        fontSize: '0.9svh',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.6px',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
    </div>
  )
}

/* ── Composant principal ── */
export default function RolePanel() {
  const [hovered, setHovered] = useState(false)
  const { me, gameStatus } = useGame()

  const allPlayers = gameStatus?.players ?? []
  const cards = buildVisibleCards(me, allPlayers)
  const allies = cards.slice(1)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '8svh',
        flexShrink: 0,
        height: '100%',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* ── Barre verticale "RÔLE SECRET" (état fermé) ── */}
      <div 
        style={{
          width: '100%',
          height: '40%',
          background: hovered
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.4)',
          transition: 'background 0.2s ease, color 0.2s ease',
          borderRadius: '0 1svh 1svh 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          color: `${theme.white}`,
          fontFamily: 'Courier New',
          fontSize: '3svh',
          fontWeight: 'bold',
          letterSpacing: '0.1svh',
          userSelect: 'none',
          opacity: hovered ? 0 : 1,
        }}
      >
        ROLE SECRET
      </div>

      {/* ── Panneau déroulant (état ouvert) ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: hovered ? '13svw' : '0',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        background: `${theme.nearBlack}C0`,
        borderRadius: '8px 0 0 8px',
        borderLeft:   `1px solid rgba(255,255,255,${hovered ? '0.12' : '0'})`,
        borderTop:    `1px solid rgba(255,255,255,${hovered ? '0.08' : '0'})`,
        borderBottom: `1px solid rgba(255,255,255,${hovered ? '0.08' : '0'})`,
        opacity: 1,
      }}>

        {/* Contenu scrollable */}
        <div className="scrollbar-roles" style={{
          width: '13svw',
          height: '100%',
          padding: '1.2svh 0.9svw',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.4svh',
          alignItems: 'center',
          justifyContent: allies.length === 0 ? 'center' : 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden',
          userSelect: 'none',
          cursor: 'default',
        }}>

          {/* Titre — affiché seulement quand il y a des alliés connus */}
          {allies.length > 0 && (
            <span style={{
              color: theme.orange,
              fontFamily: 'Georgia, serif',
              fontSize: '1.3svh',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              borderBottom: `1px solid ${theme.orange}33`,
              width: '100%',
              textAlign: 'center',
              paddingBottom: '0.6svh',
              flexShrink: 0,
            }}>
              Identité secrète
            </span>
          )}

          {/* Ma carte */}
          {cards[0] && (
            <RoleCard
              player={cards[0].player}
              label={cards[0].label}
              isMe={true}
            />
          )}

          {/* Cartes des alliés connus */}
          {allies.length > 0 && (
            <>
              <Divider label="vos alliés" />
              {allies.map(c => (
                <RoleCard
                  key={c.player.uuid}
                  player={c.player}
                  label={c.label}
                  isMe={false}
                />
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
