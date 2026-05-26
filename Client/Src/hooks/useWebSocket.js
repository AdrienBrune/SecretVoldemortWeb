import { useEffect, useRef, useCallback } from 'react'

/**
 * Manages the WebSocket connection to the C++ server.
 * @param {string} host  - e.g. "localhost:8080"
 * @param {function} onMessage - called for each received JSON frame
 * @returns {{ send, connected }}
 */
export function useWebSocket(host, onMessage) {
  const ws        = useRef(null)
  const onMsgRef  = useRef(onMessage)

  // Keep onMessage up to date without recreating the effect
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!host) return

    const socket = new WebSocket(`ws://${host}/ws`)
    ws.current = socket

    socket.onopen = () => {
      const uuid = localStorage.getItem('uuid') ?? ''
      socket.send(JSON.stringify({ type: 'identify', content: { uuid } }))
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        onMsgRef.current(msg)
      } catch {
        console.error('Message non-JSON reçu :', event.data)
      }
    }

    socket.onerror = (err) => console.error('WebSocket error', err)

    socket.onclose = () => {
      console.log('WebSocket fermé')
      onMsgRef.current({ type: '_disconnected' })
    }

    return () => socket.close()
  }, [host]) // reconnects if the host changes

  const send = useCallback((obj) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(obj))
    }
  }, [])

  return { send }
}
