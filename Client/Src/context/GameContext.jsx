import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useSounds }    from '../hooks/useSounds'
import { STEPS }        from '../constants/steps'

const GameContext = createContext(null)

export function GameProvider({ host, children }) {
  const [connected,   setConnected]   = useState(false)
  const [myUuid,      setMyUuid]      = useState(null)
  const [gameStatus,  setGameStatus]  = useState(null)
  const [messages,    setMessages]    = useState([])
  const [popup,       setPopup]       = useState(null)
  const [delay,       setDelay]       = useState(null)
  const [chatMessageList, setChatMessageList] = useState([]);

  const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem('soundVolume') ?? '0.5'))

  const setVolume = useCallback((v) => {
    localStorage.setItem('soundVolume', v)
    setVolumeState(v)
  }, [])

  const { play: playSound, stopMusic } = useSounds(volume)
  const prevPlayersRef = useRef([])

  // Ref to send so it can be called from handleMessage
  // (send is defined later, but always available at runtime)
  const sendRef = useRef(null)
  const popupTimerRef = useRef(null)
  const delayTimerRef = useRef(null)

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {

      case 'identify': {
        const uuid = msg.content.uuid
        localStorage.setItem('uuid', uuid)
        setMyUuid(uuid)
        setConnected(true)
        // Send the name as soon as the server has identified us
        const name = localStorage.getItem('playerName') ?? ''
        if (name) {
          sendRef.current?.({ type: 'command', content: { command: 'rename', rename: name } })
        }
        break
      }

      case 'game':
        setGameStatus(msg.content)
        break

      case 'message':
        setMessages(prev => [...prev, msg.content.message])
        break

      case 'chatbox': {
        const incomingMsg = {
          id: msg.content.id || Date.now() + Math.random().toString(),
          uuid: msg.content.sender,
          text: msg.content.message
        };
        setChatMessageList((prevMessages) => [...prevMessages, incomingMsg]);
        break;
      }

      case 'pop-up':
        clearTimeout(popupTimerRef.current)
        setPopup(msg.content)
        if (msg.content.timeout > 0) {
          popupTimerRef.current = setTimeout(() => setPopup(null), msg.content.timeout * 1000)
        }
        break

      case 'delay': {
        const duration = parseFloat(msg.content.time_sec)
        clearTimeout(delayTimerRef.current)
        setDelay({ duration, startedAt: Date.now() })
        delayTimerRef.current = setTimeout(() => setDelay(null), duration * 1000)
        break
      }

      case 'exception':
        console.error('[Server exception]', msg.content.message)
        break

      case '_disconnected':
        setConnected(false)
        setGameStatus(null)
        break
    }
  }, [])

  const handleMessageRef = useRef(null)
  handleMessageRef.current = handleMessage
  
  const stableHandleMessage = useCallback((msg) => {
    handleMessageRef.current?.(msg)
  }, [])

  const { send } = useWebSocket(host, stableHandleMessage)
  sendRef.current = send

  useEffect(() => {
    return () => {
      clearTimeout(popupTimerRef.current)
      clearTimeout(delayTimerRef.current)
    }
  }, [])

  const sendResponse = useCallback((data) => {
    send({
      type: 'response',
      content: {
        step: gameStatus?.step?.id,
        data
      }
    })
  }, [send, gameStatus?.step?.id])

  const sendChatMessage = useCallback((text) => {
    send({
      type: 'chatbox',
      content: {
        sender: myUuid,
        text: text
      }
    })
  }, [send, myUuid])

  const sendCommand = useCallback((cmdData) => {
    let content = {};
    if (typeof cmdData === 'string') {
      content = { command: cmdData };
    } else {
      content = { ...cmdData };
    }

    send({ 
      type: 'command', 
      content: content 
    });
  }, [send]);

  const sendPing = useCallback(() => {
    send({ type: 'ping' })
  }, [send])

  // Kill sound when player status changes
  useEffect(() => {
    const players = gameStatus?.players ?? []
    const prev    = prevPlayersRef.current
    if (prev.length > 0) {
      const newlyDead = players.some(p => p.dead && !prev.find(pp => pp.uuid === p.uuid)?.dead)
      if (newlyDead) playSound('kill')
    }
    prevPlayersRef.current = players
  }, [gameStatus?.players])

  // Sounds triggered by step changes
  useEffect(() => {
    const stepId = gameStatus?.step?.id
    if (stepId === undefined) return

    switch (stepId) {
      case STEPS.waiting_room:
        playSound('start')
        break
      case STEPS.start_turn:
        stopMusic()
        break
      case STEPS.game_finished:
        playSound('end')
        break
      case STEPS.trigger_power_avada_kedavra:
      case STEPS.trigger_power_endoloris:
      case STEPS.trigger_power_divination:
      case STEPS.trigger_power_impero:
        playSound('unlock')
        break
      case STEPS.law_voted:
      case STEPS.law_on_top_of_the_pile_voted:
        playSound('card')
        break
      case STEPS.director_discard:
        playSound('card')
        break
      case STEPS.minister_discard:
        playSound('draw')
        break
    }
  }, [gameStatus?.step?.id])

  // The "me" player in the player list
  const me = gameStatus?.players?.find(p => p.uuid === myUuid) ?? null

  return (
    <GameContext.Provider value={{
      connected,
      myUuid,
      me,
      gameStatus,
      setGameStatus,
      messages,
      popup,
      setPopup,
      delay,
      sendResponse,
      sendCommand,
      sendPing,
      playSound,
      volume,
      setVolume,
      chatMessageList,
      sendChatMessage
    }}>
      {children}
    </GameContext.Provider>
  )
}

/** Hook pour consommer le context depuis n'importe quel composant */
export function useGame() {
  return useContext(GameContext)
}
