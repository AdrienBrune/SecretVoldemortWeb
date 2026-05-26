import { theme } from '../theme'

const DEBUG_MODE = import.meta.env.VITE_APP_DEBUG === 'true';

const ALL_PAGES = DEBUG_MODE 
  ? ['home', 'game', 'debug'] 
  : ['home', 'game'];

const dotBase = {
  borderRadius: '50%',
  background: theme.orange,
  border: 'none',
  padding: 0,
  transition: 'opacity 0.2s, width 0.15s, height 0.15s',
}

export default function PageDots({ current, onNavigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', userSelect: 'none' }}>
      {ALL_PAGES.map(page => {
        const active = page === current
        return (
          <button
            key={page}
            style={{
              ...dotBase,
              width:   active ? '1.5svmin' : '1.1svmin',
              height:  active ? '1.5svmin' : '1.1svmin',
              opacity: active ? 1 : 0.4,
              cursor:  active ? 'default' : 'pointer',
            }}
            onClick={() => !active && onNavigate(page)}
            title={page}
          />
        )
      })}
    </div>
  )
}
