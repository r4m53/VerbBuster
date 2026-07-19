const STORAGE_KEY = 'verb-buster-profile-v1';

export function defaultProfile() {
  return { version: 1, nickname: 'Verb Buster', avatar: { skin: '#c9855b', hair: '#3b2418', jersey: '#14213d', number: '7', accessory: 'none' } };
}

export function loadProfile(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY));
    return saved?.version === 1 ? saved : defaultProfile();
  } catch { return defaultProfile(); }
}

export function saveProfile(profile, storage = globalThis.localStorage) {
  const safe = {
    version: 1,
    nickname: String(profile.nickname || 'Verb Buster').trim().slice(0, 24) || 'Verb Buster',
    avatar: {
      skin: profile.avatar.skin,
      hair: profile.avatar.hair,
      jersey: profile.avatar.jersey,
      number: String(profile.avatar.number || '7').replace(/\D/g, '').slice(0, 2) || '7',
      accessory: ['none', 'glasses', 'headband'].includes(profile.avatar.accessory) ? profile.avatar.accessory : 'none'
    }
  };
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch {}
  return safe;
}

export function avatarSvg(profile, size = 180) {
  const { skin, hair, jersey, number, accessory } = profile.avatar;
  const safeName = String(profile.nickname).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
  return `<svg class="player-avatar" viewBox="0 0 180 180" width="${size}" height="${size}" role="img" aria-label="${safeName}'s avatar">
    <circle cx="90" cy="90" r="86" fill="#d9f43b" stroke="#172033" stroke-width="7"/>
    <path d="M39 167c5-36 23-52 51-52s46 16 51 52" fill="${jersey}" stroke="#172033" stroke-width="6"/>
    <circle cx="90" cy="76" r="43" fill="${skin}" stroke="#172033" stroke-width="6"/>
    <path d="M49 72c0-34 16-49 42-49 25 0 43 17 43 47-12-8-20-18-25-29-14 16-32 25-60 31z" fill="${hair}" stroke="#172033" stroke-width="5"/>
    <circle cx="74" cy="78" r="4" fill="#172033"/><circle cx="106" cy="78" r="4" fill="#172033"/>
    <path d="M77 96c8 7 18 7 26 0" fill="none" stroke="#172033" stroke-width="4" stroke-linecap="round"/>
    ${accessory === 'glasses' ? '<path d="M59 73h27v17H59zm35 0h27v17H94zM86 79h8" fill="none" stroke="#172033" stroke-width="4"/>' : ''}
    ${accessory === 'headband' ? `<path d="M51 56c23-11 52-13 79 0" fill="none" stroke="#ff654d" stroke-width="8"/>` : ''}
    <text x="90" y="157" text-anchor="middle" fill="#fff" font-family="Arial Black, sans-serif" font-size="25">${number}</text>
  </svg>`;
}
