// 线性 SVG 图标系统（统一 1.8 线宽、圆角端点，viewBox 24）
const PATHS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/>',
  pin: '<path d="M12 21s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  bell: '<path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 004 0"/>',
  cal: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 5.5a3 3 0 010 5.8M21 20c0-2.6-1.6-4.2-4-4.8"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 18l6-6-6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  fork: '<path d="M7 3v7M5 3v4a2 2 0 004 0V3M9 10v10M16 3c-1.8 0-3 2-3 5s1 4 3 4M16 12v9"/>',
  mountain: '<path d="M3 20l6-11 4 7 2.5-4L21 20z"/>',
  dice: '<rect x="5" y="5" width="14" height="14" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
  plane: '<path d="M21 16l-9-3-4-7-2 1 3 7-6 3 1 2 6-3 3 6 1-1-2-6 6-2z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wifi: '<path d="M3 9a13 13 0 0118 0M6 12.5a8 8 0 0112 0M9 16a3.5 3.5 0 016 0"/>',
  battery: '<rect x="2" y="8" width="18" height="9" rx="2.5"/><rect x="4" y="10" width="12" height="5" rx="1" fill="currentColor" stroke="none"/><path d="M21 11v3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  heart: '<path d="M12 20s-7-4.4-9-8.5C1.4 8 3.6 5 6.5 5c2 0 3.7 1.2 4.5 2.7C11.8 6.2 13.5 5 15.5 5 18.4 5 20.6 8 21 11.5 19 15.6 12 20 12 20z"/>',
  thumbsUp: '<path d="M7 10v11H4V10h3zM7 10l4-7c2 0 3 1.5 2.5 3.5L13 10h6a2 2 0 012 2.5l-1.8 8A2 2 0 0117.3 22H7"/>',
  edit: '<path d="M4 20h4.5L20 8.5a2.1 2.1 0 000-3l-1.5-1.5a2.1 2.1 0 00-3 0L4 15.5V20z"/><path d="M13.5 6.5l4 4"/>'
}

const TYPE_ICONS = {
  dinner: 'fork',
  outdoor: 'mountain',
  group: 'dice',
  trip: 'plane'
}

function icon(name, color) {
  const p = (PATHS[name] || '').replace(/currentColor/g, color)
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

function typeIcon(type, color) {
  return icon(TYPE_ICONS[type] || 'spark', color || '#6B7480')
}

module.exports = {
  icon: icon,
  typeIcon: typeIcon,
  TYPE_ICONS: TYPE_ICONS
}
