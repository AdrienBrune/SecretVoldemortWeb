import { useRef, useCallback, useEffect } from 'react'

const ALL_SOUNDS = import.meta.glob('../../Ressources/sound_*.wav', { eager: true })

function src(name) {
  return ALL_SOUNDS[`../../Ressources/${name}`]?.default ?? null
}

const SOUND_FILES = {
  start:  { src: src('sound_start.wav'),  loop: true  },
  end:    { src: src('sound_end.wav'),    loop: false },
  click:  { src: src('sound_click.wav'),  loop: false },
  draw:   { src: src('sound_draw.wav'),   loop: false },
  card:   { src: src('sound_card.wav'),   loop: false },
  hover:  { src: src('sound_hover.wav'),  loop: false },
  kill:   { src: src('sound_kill.wav'),   loop: false },
  unlock: { src: src('sound_unlock.wav'), loop: false },
}

export function useSounds(volume) {
  const audios       = useRef({})
  const currentMusic = useRef(null)
  const volumeRef    = useRef(volume)

  useEffect(() => {
    for (const [name, cfg] of Object.entries(SOUND_FILES)) {
      if (!cfg.src) continue
      const a  = new Audio(cfg.src)
      a.loop   = cfg.loop
      a.volume = volumeRef.current
      audios.current[name] = a
    }
    return () => {
      for (const a of Object.values(audios.current)) a.pause()
    }
  }, [])

  useEffect(() => {
    volumeRef.current = volume
    for (const a of Object.values(audios.current)) a.volume = volume
  }, [volume])

  const play = useCallback((name) => {
    const audio = audios.current[name]
    if (!audio) return

    if (SOUND_FILES[name]?.loop) {
      if (currentMusic.current === audio) return
      if (currentMusic.current) {
        currentMusic.current.pause()
        currentMusic.current.currentTime = 0
      }
      currentMusic.current = audio
      audio.currentTime = 0
      audio.play().catch(() => {})
    } else {
      audio.currentTime = 0
      audio.play().catch(() => {})
    }
  }, [])

  const stopMusic = useCallback(() => {
    if (currentMusic.current) {
      currentMusic.current.pause()
      currentMusic.current.currentTime = 0
      currentMusic.current = null
    }
  }, [])

  return { play, stopMusic }
}
