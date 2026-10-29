import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { staffState } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const auth = await requireStaff(req, params.slug);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(await staffState(auth.clinic));
}
