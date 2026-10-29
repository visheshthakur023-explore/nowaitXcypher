import { MongoClient } from 'mongodb';
import { SAMPLE } from './sample';

const g = globalThis;

function db() {
  if (!g.__nowaitMongo) {
    g.__nowaitMongo = new MongoClient(process.env.MONGODB_URI)
      .connect()
      .then(async (client) => {
        const d = client.db(process.env.MONGODB_DB || 'nowait');
        await d.collection('tokens').createIndex({ clinicId: 1, day: 1 });
        return d;
      })
      .catch((e) => { g.__nowaitMongo = null; throw e; }); // retry on next request
  }
  return g.__nowaitMongo;
}

export async function getClinic(slug) {
  const d = await db();
  let c = await d.collection('clinics').findOne({ _id: slug });
  if (!c && slug === SAMPLE.slug) {
    const { _id, ...rest } = SAMPLE;
    await d.collection('clinics').updateOne({ _id }, { $setOnInsert: rest }, { upsert: true });
    c = await d.collection('clinics').findOne({ _id: slug });
  }
  return c;
}
export async function setClinic(id, patch) {
  const d = await db();
  await d.collection('clinics').updateOne({ _id: id }, { $set: patch });
  return d.collection('clinics').findOne({ _id: id });
}
// Atomic per-clinic, per-day counter so two patients can never get the same token number.
export async function nextTokenNumber(clinicId, day) {
  const d = await db();
  const r = await d.collection('counters').findOneAndUpdate(
    { _id: clinicId + ':' + day },
    { $inc: { n: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return r.n;
}
export async function insertToken(t) { const d = await db(); await d.collection('tokens').insertOne(t); return t; }
export async function getToken(id) { const d = await db(); return d.collection('tokens').findOne({ _id: id }); }
export async function updateToken(id, patch) { const d = await db(); await d.collection('tokens').updateOne({ _id: id }, { $set: patch }); }
export async function listDay(clinicId, day) { const d = await db(); return d.collection('tokens').find({ clinicId, day }).toArray(); }
export async function recentDone(clinicId, n) {
  const d = await db();
  return d.collection('tokens')
    .find({ clinicId, status: 'done', calledAt: { $ne: null }, doneAt: { $ne: null } })
    .sort({ doneAt: -1 }).limit(n).toArray();
}
