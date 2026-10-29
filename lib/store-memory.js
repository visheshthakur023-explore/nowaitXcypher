// Demo mode: everything lives in memory (resets when the server restarts).
import { SAMPLE } from './sample';

const g = globalThis;
const S = g.__nowaitMem || (g.__nowaitMem = { clinics: new Map(), tokens: new Map(), counters: new Map() });

export async function getClinic(slug) {
  if (!S.clinics.has(slug) && slug === SAMPLE.slug) S.clinics.set(slug, { ...SAMPLE });
  const c = S.clinics.get(slug);
  return c ? { ...c } : null;
}
export async function setClinic(id, patch) {
  const c = S.clinics.get(id);
  Object.assign(c, patch);
  return { ...c };
}
export async function nextTokenNumber(clinicId, day) {
  const k = clinicId + ':' + day;
  const n = (S.counters.get(k) || 0) + 1;
  S.counters.set(k, n);
  return n;
}
export async function insertToken(t) { S.tokens.set(t._id, { ...t }); return t; }
export async function getToken(id) { const t = S.tokens.get(id); return t ? { ...t } : null; }
export async function updateToken(id, patch) { Object.assign(S.tokens.get(id), patch); }
export async function listDay(clinicId, day) {
  return [...S.tokens.values()].filter((t) => t.clinicId === clinicId && t.day === day).map((t) => ({ ...t }));
}
export async function recentDone(clinicId, n) {
  return [...S.tokens.values()]
    .filter((t) => t.clinicId === clinicId && t.status === 'done' && t.calledAt && t.doneAt)
    .sort((a, b) => b.doneAt - a.doneAt)
    .slice(0, n)
    .map((t) => ({ ...t }));
}
