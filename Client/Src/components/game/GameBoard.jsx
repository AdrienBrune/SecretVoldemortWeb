import PowerTrack from './PowerTrack'
import LawTrack   from './LawTrack'
import ElectionTrack from './ElectionTrack'

export default function GameBoard({ board, laws, electionTracker }) {
  const deathEaterVoted = board?.deatheater?.voted ?? 0
  const powers          = board?.powers            ?? []

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ElectionCounter — 12% */}
      <div style={{
        height: '12%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ElectionTrack count = {electionTracker}></ElectionTrack>
      </div>

      {/* LawCards — 70% */}
      <div style={{
        height: '70%',
        flexShrink: 0,
        minHeight: 0,
      }}>
        <LawTrack board={board} laws={laws} />
      </div>

      {/* PowerTrack — 18% */}
      <div style={{
        height: '18%',
        flexShrink: 0,
      }}>
        <PowerTrack powers={powers} deathEaterVoted={deathEaterVoted} />
      </div>

    </div>
  )
}
