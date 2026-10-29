import { NextResponse } from 'next/server';
import { tokenStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const s = await tokenStatus(params.id);
  if (!s) return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  return NextResponse.json(s);
}
