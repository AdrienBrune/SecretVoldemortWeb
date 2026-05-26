import { useGame }  from '../context/GameContext'
import { theme } from '../theme'

// Pre-imports all images from the Ressources folder
const ALL_IMAGES = import.meta.glob('../../Ressources/*.png', { eager: true })

function getImageSrc(name) {
  if (!name) return null
  const key = `../../Ressources/${name}`
  return ALL_IMAGES[key]?.default ?? null
}

export default function PopupOverlay() {
  const { popup, setPopup, playSound } = useGame()

  if (!popup) return null

  const imgSrc = getImageSrc(popup.image)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* Carte centrale */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.6rem',
        background: `${theme.nearBlack}F2`,
        border: `1px solid ${theme.orange}55`,
        borderRadius: '14px',
        padding: '2.2rem 3rem 2rem',
        boxShadow: `0 0 40px ${theme.orange}33, 0 8px 32px rgba(0,0,0,0.7)`,
        maxWidth: '42svw',
        width: '90%',
        minWidth: '280px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Image en haut */}
        {imgSrc && (
          <img
            src={imgSrc}
            alt={popup.image}
            draggable={false}
            style={{
              height: '28svh',
              maxWidth: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Message */}
        <p style={{
          color: '#e8e8e8',
          fontSize: '2.2svh',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          lineHeight: 1.55,
          margin: 0,
        }}>
          {popup.message}
        </p>

        {/* Barre de timeout */}
        <div
          key={popup.message}
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.22)',
            transformOrigin: 'center',
            ...(popup.timeout > 0 && {
              animation: `expandFromCenter ${popup.timeout}s linear forwards`,
            }),
          }}
        />

        {/* Bouton Continuer */}
        <button
          onClick={() => { playSound('click'); setPopup(null) }}
          style={{
            marginTop: '0.4rem',
            padding: '0.55rem 2.2rem',
            background: 'transparent',
            border: `1.5px solid ${theme.orange}`,
            borderRadius: '6px',
            color: theme.orange,
            fontSize: '1.5svh',
            fontFamily: 'Georgia, serif',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'background 0.18s ease, color 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = theme.orange
            e.currentTarget.style.color = theme.nearBlack
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = theme.orange
          }}
        >
          Continuer
        </button>

      </div>
    </div>
  )
}
