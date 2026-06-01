import PowerTrack from './PowerTrack'
import LawTrack   from './LawTrack'
import ElectionTrack from './ElectionTrack'
import PileTrack from './PileTrack'

export default function GameBoard({ board, laws, electionTracker }) {
  const deathEaterVoted = board?.deatheater?.voted ?? 0
  const powers = board?.powers?? []

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
    }}>

      {/* Game Board — 60%w */}
      <div style={{
        flex: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '60svh',
      }}>

        {/* ElectionCounter — 12%h */}
        <div style={{
          height: '10%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ElectionTrack count = {electionTracker}></ElectionTrack>
        </div>

        {/* LawCards — 70%h */}
        <div style={{
          height: '72%',
          flexShrink: 0,
          minHeight: 0,
        }}>
          <LawTrack board={board} laws={laws} />
        </div>

        {/* PowerTrack — 18%h */}
        <div style={{
          height: '18%',
          flexShrink: 0,
        }}>
          <PowerTrack powers={powers} deathEaterVoted={deathEaterVoted} />
        </div>
      </div>

      {/* Pile/Discard — 40%w */}
      <div style={{
          flex: 1,
          width: '40svh',
        }}>
          <PileTrack board={board} laws={laws}/>
        </div>


    </div>
  )
}
