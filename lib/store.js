// Picks the database: MongoDB if MONGODB_URI is set, otherwise in-memory demo mode.
import * as mem from './store-memory';
import * as mongo from './store-mongo';

const useMongo = Boolean(process.env.MONGODB_URI);
if (!useMongo && !globalThis.__nowaitWarned) {
  globalThis.__nowaitWarned = true;
  console.log('[NoWait] No MONGODB_URI set: running in DEMO MODE (data is kept in memory).');
}
const impl = useMongo ? mongo : mem;

export const getClinic = (...a) => impl.getClinic(...a);
export const setClinic = (...a) => impl.setClinic(...a);
export const nextTokenNumber = (...a) => impl.nextTokenNumber(...a);
export const insertToken = (...a) => impl.insertToken(...a);
export const getToken = (...a) => impl.getToken(...a);
export const updateToken = (...a) => impl.updateToken(...a);
export const listDay = (...a) => impl.listDay(...a);
export const recentDone = (...a) => impl.recentDone(...a);
