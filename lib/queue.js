import { randomBytes } from 'node:crypto';
import * as store from './store';
import { sendAlert, normalizePhone } from './notify';

const ALERT_WHEN_AHEAD = 3;

// "today" in India time, so token numbers restart every morning
export const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

const isActive = (t) => t.status === 'waiting' || t.status === 'serving';
const byNumber = (a, b) => a.tokenNumber - b.tokenNumber;

export const getClinic = (slug) => store.getClinic(slug);

// Average of the last 10 finished consults (minutes). Falls back to the clinic default.
export async function avgConsultMinutes(clinic) {
  const rows = await store.recentDone(clinic._id, 10);
  const mins = rows.map((r) => (r.doneAt - r.calledAt) / 60000).filter((m) => m >= 0 && m < 60);
  if (!mins.length) return clinic.defaultAvgMin;
  return Math.max(1, mins.reduce((a, b) => a + b, 0) / mins.length);
}

export async function joinQueue(clinic, name, phone, source = 'qr') {
  const day = today();
  const tokenNumber = await store.nextTokenNumber(clinic._id, day);
  const t = {
    _id: randomBytes(5).toString('hex'), // unguessable id, so patients can't peek at each other's tokens
    clinicId: clinic._id,
    day,
    tokenNumber,
    patientName: name.trim(),
    phone: phone ? normalizePhone(phone) : null,
    source,
    status: 'waiting',
    alerted: false,
    createdAt: Date.now(),
    calledAt: null,
    doneAt: null,
  };
  await store.insertToken(t);
  return t;
}

// Public numbers shown on the join page before someone takes a token.
export async function clinicPublic(clinic) {
  const avg = await avgConsultMinutes(clinic);
  const inQueue = (await store.listDay(clinic._id, today())).filter(isActive).length;
  return { name: clinic.name, paused: clinic.paused, inQueue, estMinutes: Math.round(inQueue * avg) };
}

export async function tokenStatus(id) {
  const t = await store.getToken(id);
  if (!t) return null;
  const clinic = await store.getClinic(t.clinicId);
  const avg = await avgConsultMinutes(clinic);
  const list = await store.listDay(t.clinicId, t.day);
  const ahead = t.status === 'waiting'
    ? list.filter((x) => isActive(x) && x.tokenNumber < t.tokenNumber).length
    : 0;
  const serving = list.find((x) => x.status === 'serving');
  return {
    id: t._id,
    slug: clinic.slug,
    tokenNumber: t.tokenNumber,
    name: t.patientName,
    status: t.status,
    clinicName: clinic.name,
    paused: clinic.paused,
    ahead,
    estMinutes: Math.round(ahead * avg),
    nowServing: serving ? serving.tokenNumber : null,
  };
}

export async function staffState(clinic) {
  const avg = await avgConsultMinutes(clinic);
  const list = (await store.listDay(clinic._id, today())).sort(byNumber);
  const serving = list.find((t) => t.status === 'serving') || null;
  const waiting = list.filter((t) => t.status === 'waiting').map((t, i) => ({
    id: t._id,
    token_number: t.tokenNumber,
    patient_name: t.patientName,
    phone: t.phone,
    source: t.source,
    createdAt: t.createdAt,
    alerted: t.alerted,
    estMinutes: Math.round((i + (serving ? 1 : 0)) * avg),
  }));
  return {
    clinicName: clinic.name,
    paused: clinic.paused,
    serving: serving ? { id: serving._id, token_number: serving.tokenNumber, patient_name: serving.patientName, calledAt: serving.calledAt } : null,
    waiting,
    avgMinutes: Math.round(avg * 10) / 10,
    servedToday: list.filter((t) => t.status === 'done').length,
  };
}

// Finish the current patient (done, or skipped) and call the next one.
export async function callNext(clinic, { skip = false } = {}) {
  const list = (await store.listDay(clinic._id, today())).sort(byNumber);
  const current = list.find((t) => t.status === 'serving');
  if (current) {
    await store.updateToken(
      current._id,
      skip ? { status: 'skipped' } : { status: 'done', doneAt: Date.now() }
    );
  }
  const next = list.find((t) => t.status === 'waiting');
  if (next) await store.updateToken(next._id, { status: 'serving', calledAt: Date.now() });
  await runAlerts(clinic._id);
}

export async function setPaused(clinic, paused) {
  await store.setClinic(clinic._id, { paused });
  if (!paused) await runAlerts(clinic._id);
}

// Send the "your turn is near" alert once to anyone with <= 3 patients ahead.
export async function runAlerts(clinicId) {
  const clinic = await store.getClinic(clinicId);
  if (!clinic || clinic.paused) return; // pause = no alerts (emergencies)
  const avg = await avgConsultMinutes(clinic);
  const rows = (await store.listDay(clinicId, today())).filter(isActive).sort(byNumber);
  const base = process.env.BASE_URL || 'http://localhost:3000';
  for (let ahead = 0; ahead < rows.length; ahead++) {
    const t = rows[ahead];
    if (t.status !== 'waiting' || t.alerted || !t.phone || ahead > ALERT_WHEN_AHEAD) continue;
    const eta = Math.max(1, Math.round(ahead * avg));
    const msg =
      `NoWait: Your turn is near! Token #${t.tokenNumber} at ${clinic.name}. ` +
      `Please reach the clinic in about ${eta} min.\n` +
      `आपका नंबर नज़दीक है! कृपया लगभग ${eta} मिनट में क्लिनिक पहुँचें।\n` +
      `Live status: ${base}/t/${t._id}`;
    await sendAlert(t.phone, msg);
    await store.updateToken(t._id, { alerted: true });
  }
}
