import { expandCurriculum } from './expanded-curriculum.js';

let cachedData;

export async function loadContent() {
  if (cachedData) return cachedData;
  const response = await fetch('data/verbs.json');
  if (!response.ok) throw new Error('Content could not be loaded.');
  const data = expandCurriculum(await response.json());
  validateContent(data);
  cachedData = data;
  return data;
}

function validateContent(data) {
  if (!Array.isArray(data?.units) || !Array.isArray(data?.verbs)) {
    throw new Error('The content file has an invalid structure.');
  }
  for (const verb of data.verbs) {
    if (!verb.id || !verb.base || !verb.past || !verb.participle || !verb.examples) {
      throw new Error(`Verb data is incomplete: ${verb.id || 'unknown'}`);
    }
  }
}

export function getUnitWithVerbs(data, unitId) {
  const unit = data.units.find((item) => item.id === unitId);
  if (!unit) return null;
  const verbs = unit.verbIds.map((id) => data.verbs.find((verb) => verb.id === id)).filter(Boolean);
  return { ...unit, verbs };
}
