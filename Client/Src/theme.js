/**
 * Gobal application theme
 */
export const theme = {
  orange:       '#c9a84c',
  darkBrown:    '#2d2720',
  lightBlack:   '#181818',
  nearBlack:    '#111111',
  white:        '#eaeaea',
  violet:       '#66546b',
  red:          '#8e121a',
  darkRed:      '#4e1717',
  lumos:        '#3d9a4f',
  navy:         '#1a2e4e',
}

Object.keys(theme).forEach(key => {
  document.documentElement.style.setProperty(`--${key}`, theme[key]);
});