import { useState } from 'react'
import { useGame } from '../context/GameContext'
import PageDots from './PageDots'

const styles = {
  page: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    color: '#e0e0e0',
    fontFamily: 'Georgia, serif',
    overflow: 'hidden',
    userSelect: 'none',
    cursor: 'default',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    minHeight: 0,
  },
  dotsBar: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.8rem 0 calc(0.8rem + env(safe-area-inset-bottom))',
  },
  card: {
    background: '#16213e',
    border: '1px solid #4a3f6b',
    borderRadius: '12px',
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    margin: 'auto',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.6rem',
    color: '#c9a84c',
    margin: '0 0 0.2rem 0',
    letterSpacing: '2px',
  },
  label: {
    fontSize: '0.8rem',
    color: '#aaa',
    margin: '0 0 0.2rem 0',
  },
  input: {
    padding: '0.45rem 0.7rem',
    borderRadius: '6px',
    border: '1px solid #4a3f6b',
    background: '#0f3460',
    color: '#e0e0e0',
    fontSize: '0.95rem',
    fontFamily: 'Georgia, serif',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  divider: {
    borderColor: '#4a3f6b',
    margin: '0.2rem 0',
  },
  statusText: {
    fontSize: '0.8rem',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#16213e',
    border: '1px solid #4a3f6b',
    borderRadius: '10px',
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '280px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  modalTitle: {
    fontSize: '1rem',
    color: '#e0e0e0',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    gap: '0.6rem',
  },
}

const btnStyles = {
  base: {
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.9rem',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  connect:  { background: '#4a3f6b', color: '#e0e0e0' },
  start:    { background: '#2e7d32', color: '#fff' },
  stop:     { background: '#7f1d1d', color: '#fff' },
  cancel:   { background: '#333', color: '#aaa' },
  disabled: { opacity: 0.4, cursor: 'not-allowed' },
}

function Btn({ onClick, disabled, style, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...btnStyles.base, ...style, ...(disabled ? btnStyles.disabled : {}) }}
    >
      {children}
    </button>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, confirmStyle }) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <p style={styles.modalTitle}>{message}</p>
        <div style={styles.modalButtons}>
          <Btn style={btnStyles.cancel} onClick={onCancel}>Annuler</Btn>
          <Btn style={confirmStyle} onClick={onConfirm}>Confirmer</Btn>
        </div>
      </div>
    </div>
  )
}


export default function HomePage({ onConnect, host, onNavigate }) {
  const { connected, myUuid, sendCommand, volume, setVolume } = useGame()

  const [ip,      setIp]      = useState(window.location.hostname || 'localhost')
  const [port,    setPort]    = useState('8080')
  const [name,    setName]    = useState(localStorage.getItem('playerName') ?? '')
  const [confirm, setConfirm] = useState(null) // { message, command, confirmStyle }
  const [debounceTimer, setDebounceTimer] = useState(null)

  const handleConnect = () => {
    if (ip.trim()) {
      onConnect(`${ip.trim()}:${port.trim()}`)
    }

    if (connected)
    {
      const playerName = localStorage.getItem('playerName');
      sendCommand({
        command: "rename",
        rename: playerName
      })
    }
  }

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)
    localStorage.setItem('playerName', newName)

    if (connected) {
      if (debounceTimer) clearTimeout(debounceTimer)
      const timer = setTimeout(() => {
        sendCommand({
          command: "rename",
          rename: newName
        })
      }, 800)
      setDebounceTimer(timer)
    }
  }

  const askConfirm = (message, command, confirmStyle) => {
    setConfirm({ message, command, confirmStyle })
  }

  const handleConfirm = () => {
    sendCommand(confirm.command)
    setConfirm(null)
  }

  return (
    <>
      <div style={styles.page}>
        <div style={styles.scrollArea}>
        <div style={styles.card}>
          <h1 style={styles.title}>Secret Voldemort</h1>

          <hr style={styles.divider} />

          {/* Connexion */}
          <div>
            <p style={styles.label}>Adresse IP du serveur</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="192.168.x.x"
                disabled={connected}
              />
              <input
                style={{ ...styles.input, width: '80px' }}
                type="text"
                value={port}
                onChange={e => setPort(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="8080"
                disabled={connected}
              />
            </div>
          </div>

          <Btn style={btnStyles.connect} onClick={handleConnect} disabled={connected || !ip.trim()}>
            {connected ? 'Connecté' : 'Se connecter'}
          </Btn>

          {/* Statut connexion */}
          <div style={styles.statusText}>
            <span style={{
              display: 'inline-block', width: '10px', height: '10px',
              borderRadius: '50%', background: connected ? '#4caf50' : '#f44336',
              marginRight: '0.5rem',
            }} />
            {connected
              ? <>Connecté — <span style={{ color: '#c9a84c', marginLeft: '0.3rem' }}>{host}</span></>
              : 'Non connecté'
            }
          </div>

          <hr style={styles.divider} />

          {/* Nom du joueur */}
          <div>
            <p style={styles.label}>Votre nom</p>
            <input
              style={styles.input}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Entrez votre nom..."
              maxLength={24}
            />
          </div>

          {myUuid && (
            <p style={{ fontSize: '0.75rem', color: '#555', wordBreak: 'break-all' }}>
              UUID : {myUuid}
            </p>
          )}

          <hr style={styles.divider} />

          {/* Volume */}
          <div>
            <p style={styles.label}>Volume</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem' }}>🔇</span>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#c9a84c', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem' }}>🔊</span>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Actions */}
          <Btn
            style={btnStyles.start}
            onClick={() => askConfirm('Commencer une partie ?', 'start', btnStyles.start)}
          >
            Commencer la partie
          </Btn>
          <Btn
            style={btnStyles.stop}
            onClick={() => askConfirm('Cela quittera la partie en cours ?', 'stop', btnStyles.stop)}
          >
            Terminer la partie
          </Btn>
        </div>
        </div>
        <div style={styles.dotsBar}>
          <PageDots current="home" onNavigate={onNavigate} />
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          confirmStyle={confirm.confirmStyle}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}
