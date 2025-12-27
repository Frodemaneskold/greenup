import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ensureSeedUser, getUserByUsername, getUserByEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

const LoginSchema = z.object({
  username: z.string().min(1), // can be username or email
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  await ensureSeedUser();

  const json = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    console.log('LOGIN invalid body', json);
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  console.log('LOGIN attempt', { username });
  let user = getUserByUsername(username);
  if (!user && username.includes('@')) {
    user = getUserByEmail(username);
  }
  if (!user) {
    console.log('LOGIN user not found');
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    console.log('LOGIN password mismatch for user', user.username);
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signJwt({ sub: String(user.id), username: user.username, email: user.email });
  console.log('LOGIN success', { userId: user.id, username: user.username });
  return Response.json({ token });
}

