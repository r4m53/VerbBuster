const STORAGE_KEY = 'verb-buster-certificates-v1';

export async function loadCertificateDefinitions() {
  const response = await fetch('data/certificates.json');
  if (!response.ok) throw new Error('Certificate collection could not be loaded.');
  return (await response.json()).certificates;
}

export function loadCertificates(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY));
    return saved?.version === 1 ? saved : { version: 1, awards: [] };
  } catch { return { version: 1, awards: [] }; }
}

export function refreshAwardDefinitions(collection, definitions, storage = globalThis.localStorage) {
  let changed = false;
  const awards = collection.awards.map((award) => {
    const current = definitions[award.number - 1];
    if (!current || JSON.stringify(award.definition) === JSON.stringify(current)) return award;
    changed = true;
    return { ...award, definition: structuredClone(current) };
  });
  return changed ? saveCertificates({ ...collection, awards }, storage) : collection;
}

function saveCertificates(collection, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(collection)); } catch {}
  return collection;
}

export function ensureWeeklyCertificate(collection, weekly, profile, definitions, storage = globalThis.localStorage) {
  if (weekly.points < 1000 || collection.awards.some((award) => award.weekKey === weekly.weekKey)) {
    return { collection, award: null };
  }
  const definition = definitions[Math.min(collection.awards.length, definitions.length - 1)];
  const award = {
    id: `${weekly.weekKey}-${collection.awards.length + 1}`,
    number: collection.awards.length + 1,
    weekKey: weekly.weekKey,
    earnedAt: new Date().toISOString(),
    points: weekly.points,
    battlesCompleted: weekly.battlesCompleted || 0,
    questionsMastered: Object.values(weekly.questions || {}).filter((question) => question.correctEarned).length,
    nickname: profile.nickname,
    avatar: structuredClone(profile.avatar),
    definition: structuredClone(definition)
  };
  const updated = { ...collection, awards: [...collection.awards, award] };
  saveCertificates(updated, storage);
  return { collection: updated, award };
}

export function syncCurrentAwardProfile(collection, weekly, profile, storage = globalThis.localStorage) {
  const updated = structuredClone(collection);
  const award = updated.awards.find((item) => item.weekKey === weekly.weekKey);
  if (award) { award.nickname = profile.nickname; award.avatar = structuredClone(profile.avatar); }
  return saveCertificates(updated, storage);
}

export function resetCertificates(storage = globalThis.localStorage) {
  try { storage?.removeItem(STORAGE_KEY); } catch {}
  return { version: 1, awards: [] };
}
