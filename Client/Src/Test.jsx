import { useState, useRef } from 'react'

export default function Test() {
  const [ip,        setIp]        = useState(window.location.hostname || 'localhost')
  const [connected, setConnected] = useState(false)
  const [uuid,      setUuid]      = useState(null)
  const [messages,  setMessages]  = useState([])
  const wsRef = useRef(null)

  const connect = () => {
    if (wsRef.current) wsRef.current.close()

    const ws = new WebSocket(`ws://${ip}:8080/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // Send the stored UUID, or empty string on first visit
      ws.send(JSON.stringify({
        type: 'identify',
        content: {
          uuid: localStorage.getItem('playerUUID') || ''
        }
      }))
    }

    ws.onclose   = () => setConnected(false)
    ws.onerror   = (err) => console.error('WebSocket error', err)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'hello') {
          localStorage.setItem('playerUUID', data.uuid)
          setUuid(data.uuid)
          console.log(data.reconnected ? 'Reconnexion' : 'Nouveau joueur', data.uuid)
          return
        }

        setMessages(prev => [...prev, data])
      } catch {
        console.error('Message non-JSON reçu :', event.data)
      }
    }
  }

  const disconnect = () => {
    wsRef.current?.close()
    setConnected(false)
    setUuid(null)
    setMessages([])
  }

  const sendPing = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        content: {}
      }))
    }
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Secret Voldemort</h1>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          type="text"
          value={ip}
          onChange={e => setIp(e.target.value)}
          placeholder="Adresse IP du serveur"
          disabled={connected}
          style={{ padding: '0.3rem 0.5rem', fontFamily: 'monospace' }}
        />
        {connected
          ? <button onClick={disconnect}>Déconnecter</button>
          : <button onClick={connect}>Connecter</button>
        }
      </div>

      <p>Statut : <strong>{connected ? '🟢 connecté' : '🔴 déconnecté'}</strong></p>
      {uuid && <p style={{ fontSize: '0.8em', color: '#666' }}>UUID : {uuid}</p>}

      <button onClick={sendPing} disabled={!connected}>
        Envoyer ping
      </button>

      <h2>Messages reçus</h2>
      {messages.length === 0
        ? <p><em>Aucun message</em></p>
        : messages.map((msg, i) => (
            <pre key={i} style={{ background: '#f4f4f4', padding: '0.5rem' }}>
              {JSON.stringify(msg, null, 2)}
            </pre>
          ))
      }
    </div>
  )
}
