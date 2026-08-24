/* ============================================================
   Keuangan TMRIZK — icon set (inline SVG, Lucide-style line icons)
   Semua icon: viewBox 24x24, stroke=currentColor, tanpa fill.
   ============================================================ */

const ICON_PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10"/><path d="M9.5 20.5V14h5v6.5"/>',
  receipt: '<path d="M6 2.5h12v19l-2.5-1.6-2.5 1.6-2.5-1.6-2.5 1.6v-19Z"/><line x1="9" y1="7.5" x2="15" y2="7.5"/><line x1="9" y1="11.5" x2="15" y2="11.5"/><line x1="9" y1="15.5" x2="12.5" y2="15.5"/>',
  'bar-chart': '<line x1="4" y1="21" x2="20" y2="21"/><rect x="6.5" y="12" width="3" height="9"/><rect x="14.5" y="7" width="3" height="14"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10.5h18"/><line x1="15.5" y1="14.5" x2="18.2" y2="14.5"/>',
  'arrow-down': '<line x1="12" y1="4" x2="12" y2="19.5"/><polyline points="6.5 14 12 19.5 17.5 14"/>',
  'arrow-up': '<line x1="12" y1="20" x2="12" y2="4.5"/><polyline points="6.5 10 12 4.5 17.5 10"/>',
  'arrow-lr': '<line x1="4" y1="8" x2="17" y2="8"/><polyline points="13 4 17 8 13 12"/><line x1="20" y1="16" x2="7" y2="16"/><polyline points="11 12 7 16 11 20"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  'chevron-left': '<polyline points="15 6 9 12 15 18"/>',
  'chevron-right': '<polyline points="9 6 15 12 9 18"/>',
  'log-out': '<path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 16.5 21 12 16 7.5"/><line x1="21" y1="12" x2="9.5" y2="12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  shield: '<path d="M12 3 5 5.5v6c0 5 3 7.8 7 9 4-1.2 7-4 7-9v-6L12 3Z"/><polyline points="8.7 12.3 10.8 14.4 15.3 9.7"/>',
  cloud: '<path d="M7.5 18.5a4.2 4.2 0 0 1 .4-8.4 5.6 5.6 0 0 1 10.8 1.9 3.6 3.6 0 0 1-.5 6.5H7.5Z"/>',
  'trending-up': '<polyline points="3.5 17 9.5 11 13.5 15 20.5 6.5"/><polyline points="14.5 6.5 20.5 6.5 20.5 11.5"/>',
  utensils: '<line x1="6" y1="2.5" x2="6" y2="21.5"/><path d="M4 2.5v6.5a2 2 0 0 0 4 0V2.5"/><path d="M17.5 2.5c-1.8 0-3 2-3 4.5v4.5h3v10"/>',
  car: '<path d="M4 17h16"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/><path d="M3 17v-4l2.2-5.5h13.6L21 13v4"/><line x1="7" y1="7.5" x2="17" y2="7.5"/>',
  'shopping-bag': '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  'file-text': '<path d="M14 3H6.5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8L14 3Z"/><polyline points="14 3 14 8 18.5 8"/><line x1="8.5" y1="13" x2="15.5" y2="13"/><line x1="8.5" y1="16.5" x2="13" y2="16.5"/>',
  film: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><line x1="7.5" y1="4.5" x2="7.5" y2="19.5"/><line x1="16.5" y1="4.5" x2="16.5" y2="19.5"/><line x1="3" y1="9.5" x2="7.5" y2="9.5"/><line x1="3" y1="14.5" x2="7.5" y2="14.5"/><line x1="16.5" y1="9.5" x2="21" y2="9.5"/><line x1="16.5" y1="14.5" x2="21" y2="14.5"/>',
  'heart-pulse': '<path d="M12 20s-8-5.2-8-11.2A4.3 4.3 0 0 1 12 6a4.3 4.3 0 0 1 8 2.8C20 14.8 12 20 12 20Z"/><polyline points="6.5 11 9 11 10.5 8.5 12.5 13 14 11 17.5 11"/>',
  'book-open': '<path d="M12 6.5C10 5.2 7.5 4.5 5 4.5v13c2.5 0 5 .7 7 2 2-1.3 4.5-2 7-2v-13c-2.5 0-5 .7-7 2Z"/><line x1="12" y1="6.5" x2="12" y2="19.5"/>',
  package: '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5"/><line x1="12" y1="9" x2="12" y2="20.5"/><path d="M3.5 9h17"/><path d="M12 9c-1.3-3-4.7-3.7-4.7-1.3S9.8 9 12 9Z"/><path d="M12 9c1.3-3 4.7-3.7 4.7-1.3S14.2 9 12 9Z"/>',
  repeat: '<polyline points="17 1.5 21 5.5 17 9.5"/><path d="M3 12V10a4 4 0 0 1 4-4h14"/><polyline points="7 22.5 3 18.5 7 14.5"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/>',
  landmark: '<line x1="3" y1="21" x2="21" y2="21"/><line x1="5" y1="21" x2="5" y2="10.5"/><line x1="19" y1="21" x2="19" y2="10.5"/><polygon points="12 3 21 9 3 9"/><line x1="9.5" y1="21" x2="9.5" y2="10.5"/><line x1="14.5" y1="21" x2="14.5" y2="10.5"/>',
  smartphone: '<rect x="7" y="2" width="10" height="20" rx="2.2"/><line x1="11" y1="18.3" x2="13" y2="18.3"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="6" y1="10" x2="6" y2="10.01"/><line x1="18" y1="14" x2="18" y2="14.01"/>',
  'clipboard-list': '<rect x="5.5" y="4" width="13" height="17.5" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><line x1="8.5" y1="11.5" x2="15.5" y2="11.5"/><line x1="8.5" y1="15" x2="15.5" y2="15"/><line x1="8.5" y1="18.5" x2="12.5" y2="18.5"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'piggy-bank': '<path d="M4.5 12.5c0-3.5 3.2-6.3 7.2-6.3 2.6 0 4.9 1.2 6.2 3h1.6a1 1 0 0 1 1 1v2.3a1 1 0 0 1-1 1h-1.1"/><path d="M4.5 12.5v3.3a1 1 0 0 0 1 1H6l.6 2.2h2.1l.4-1.5h4l.4 1.5h2.1l.6-2.2v-1.3"/><circle cx="15" cy="10.5" r=".4" fill="currentColor" stroke="none"/><line x1="8" y1="6.6" x2="7" y2="4.5"/>'
};

function icon(name, cls){
  const inner = ICON_PATHS[name] || ICON_PATHS['package'];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cls ? ` class="${cls}"` : ''}>${inner}</svg>`;
}

function renderStaticIcons(root){
  (root || document).querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.getAttribute('data-icon'));
  });
}
