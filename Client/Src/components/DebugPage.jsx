import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import PageDots from './PageDots'

export default function DebugPage({ onNavigate }) {
  const { gameStatus, setGameStatus, connected, myUuid } = useGame()

  const [draft,   setDraft]   = useState('')
  const [error,   setError]   = useState(null)
  const [dirty,   setDirty]   = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Sync from the server only if the user has no unapplied changes
  useEffect(() => {
    if (!dirty) {
      setDraft(JSON.stringify(gameStatus ?? {}, null, 2))
    }
  }, [gameStatus, dirty])

  const handleChange = (e) => {
    setDraft(e.target.value)
    setDirty(true)
    setError(null)
    setSaved(false)
  }

  const handleApply = () => {
    try {
      const parsed = JSON.parse(draft)
      setGameStatus(parsed)
      setDirty(false)
      setError(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleReset = () => {
    setDraft(JSON.stringify(gameStatus ?? {}, null, 2))
    setDirty(false)
    setError(null)
  }

  return (
    <div style={{
      height: '100svh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#000000a4',
    }}>

      {/* En-tête */}
      <div style={{
        flexShrink: 0,
        padding: '0.5rem 1rem',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <span style={{ color: '#c9a84c', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          Debug — état du jeu
        </span>
        <span style={{
          fontSize: '0.65rem',
          padding: '0.1rem 0.5rem',
          borderRadius: '4px',
          background: connected ? 'rgba(46,125,50,0.3)' : 'rgba(127,29,29,0.3)',
          color: connected ? '#4caf50' : '#f44336',
          border: `1px solid ${connected ? '#4caf50' : '#f44336'}`,
        }}>
          {connected ? 'connecté' : 'déconnecté'}
        </span>

        {/* Boutons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {dirty && (
            <button onClick={handleReset} style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '5px',
              border: '1px solid #4a3f6b',
              background: 'transparent',
              color: '#888',
              fontSize: '0.75rem',
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
            }}>
              Réinitialiser
            </button>
          )}
          <button onClick={handleApply} style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '5px',
            border: 'none',
            background: saved ? '#2e7d32' : dirty ? '#c9a84c' : '#2a2a4a',
            color: dirty ? '#000' : '#666',
            fontSize: '0.75rem',
            fontFamily: 'Georgia, serif',
            cursor: dirty ? 'pointer' : 'default',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}>
            {saved ? '✓ Appliqué' : 'Appliquer'}
          </button>
        </div>
      </div>

      {/* Erreur JSON */}
      {error && (
        <div style={{
          flexShrink: 0,
          padding: '0.4rem 1rem',
          background: 'rgba(127,29,29,0.3)',
          borderBottom: '1px solid #7f1d1d',
          color: '#f44336',
          fontSize: '0.75rem',
          fontFamily: 'Consolas, monospace',
        }}>
          ✗ {error}
        </div>
      )}

      {/* Éditeur JSON */}
      <textarea
        value={draft}
        onChange={handleChange}
        spellCheck={false}
        style={{
          flex: 1,
          background: 'transparent',
          color: error ? '#f44336' : dirty ? '#c9a84c' : '#a8d8a8',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '0.75rem',
          lineHeight: '1.6',
          padding: '1rem 1.2rem',
          border: 'none',
          outline: 'none',
          resize: 'none',
          whiteSpace: 'pre',
          overflowY: 'auto',
        }}
      />

      {/* Dots de navigation */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.8rem 0',
        borderTop: '1px solid #2a2a4a',
      }}>
        <PageDots current="debug" onNavigate={onNavigate} />
      </div>

    </div>
  )
}
