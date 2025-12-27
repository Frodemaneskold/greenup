import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { getUserByUsername } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = await verifyJwt<{ sub?: string; username?: string }>(token);
    const uname = payload.username;
    if (!uname) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = getUserByUsername(uname);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({
      id: user.id,
      username: user.username,
      email: user.email ?? null,
      total_co2_saved: user.total_co2_saved ?? 0,
      created_at: user.created_at,
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


