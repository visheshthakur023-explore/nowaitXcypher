import { NextResponse } from 'next/server';
import { getClinic, clinicPublic } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const clinic = await getClinic(params.slug);
  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  return NextResponse.json(await clinicPublic(clinic));
}
