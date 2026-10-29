import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { callNext, setPaused, joinQueue } from '@/lib/queue';
import { normalizePhone } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const auth = await requireStaff(req, params.slug);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { clinic } = auth;
  const body = await req.json();

  switch (body.action) {
    case 'next': await callNext(clinic); break;
    case 'skip': await callNext(clinic, { skip: true }); break;
    case 'pause': await setPaused(clinic, true); break;
    case 'resume': await setPaused(clinic, false); break;
    case 'walkin': {
      if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      // phone is optional for walk-ins (patients without smartphones)
      if (body.phone && !normalizePhone(body.phone)) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      await joinQueue(clinic, body.name, body.phone || null, 'staff');
      break;
    }
    default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
