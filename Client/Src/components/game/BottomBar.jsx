import PageDots from '../PageDots'
import { theme } from '../../theme'
import { useGame } from '../../context/GameContext'

export default function BottomBar({ step, onNavigate, showProgress = true }) {
  const { messages, delay } = useGame()
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

  return (
    <div style={{
      height: '25svh',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.1svh 2svw 0 2svw',
      gap: '0',
      userSelect: 'none',
      cursor: 'default',
    }}>

      {/* ── Box noire semi-transparente ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        borderRadius: '1svh',
        background: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.6svh 2svw 0.5svh',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Barre de chargement collée en haut ── */}
        {showProgress && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '0.39svh',
            background: 'rgba(255, 255, 255, 0.15)',
          }}>
            <div
              key={delay?.startedAt ?? 'static'}
              style={{
                position: 'absolute',
                left: 0, top: 0,
                width: '100%', height: '100%',
                background: theme.orange,
                transformOrigin: 'center',
                ...(delay && {
                  animation: `expandFromCenter ${delay.duration}s linear forwards`,
                }),
              }}
            />
          </div>
        )}

        {/* Message */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            color: '#e0e0e0',
            fontSize: '4svh',
            fontFamily: 'Georgia, serif',
            textAlign: 'center',
          }}>
            {lastMessage ?? step?.name ?? '—'}
          </span>
        </div>

      </div>

      {/* ── Dots de navigation ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.8svh 0',
      }}>
        <PageDots current="game" onNavigate={onNavigate} />
      </div>

    </div>
  )
}
