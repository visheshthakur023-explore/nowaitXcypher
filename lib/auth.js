import { getClinic } from './queue';

// Staff routes send the clinic PIN in the x-staff-pin header.
export async function requireStaff(req, slug) {
  const clinic = await getClinic(slug);
  if (!clinic) return { error: 'Clinic not found', status: 404 };
  if (req.headers.get('x-staff-pin') !== clinic.pin) return { error: 'Wrong PIN', status: 401 };
  return { clinic };
}
