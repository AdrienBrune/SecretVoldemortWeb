import { useState } from 'react'
import { GameProvider } from './context/GameContext'
import HomePage from './components/HomePage'
import GamePage from './components/GamePage'
import DebugPage from './components/DebugPage'

export default function App() {
  const [host, setHost] = useState(null)
  const [page, setPage] = useState('home') // 'home' | 'game' | 'debug'

  return (
    <GameProvider host={host}>
      {page === 'home'  && <HomePage  onConnect={setHost} host={host} onNavigate={setPage} />}
      {page === 'game'  && <GamePage  onNavigate={setPage} />}
      {page === 'debug' && <DebugPage onNavigate={setPage} />}
    </GameProvider>
  )
}
