import { NextResponse } from 'next/server';
import { getClinic, joinQueue } from '@/lib/queue';
import { normalizePhone } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { slug, name, phone } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
  if (!normalizePhone(phone)) return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
  const clinic = await getClinic(slug);
  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  const t = await joinQueue(clinic, name, phone, 'qr');
  return NextResponse.json({ id: t._id, tokenNumber: t.tokenNumber });
}
