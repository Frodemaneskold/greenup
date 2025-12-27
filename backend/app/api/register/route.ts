import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ensureSeedUser, getUserByEmail, createUserWithEmail, getUserByUsername } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

// Helper to coerce {text: "..."} or {value: "..."} to string
const coerceText = <T extends z.ZodString>(schema: T) =>
  z.preprocess((v) => {
    if (typeof v === 'object' && v !== null) {
      const anyV: any = v;
      if (typeof anyV.value === 'string') return anyV.value;
      if (typeof anyV.text === 'string') return anyV.text;
    }
    return v;
  }, schema);

const RegisterSchema = z
  .object({
    firstName: coerceText(z.string()).optional(),
    lastName: coerceText(z.string()).optional(),
    username: coerceText(
      z
        .string()
        .min(3)
        .regex(/^[\p{L}0-9_.]+$/u, 'Only letters, digits, _ and . are allowed')
    ).optional(),
    email: coerceText(z.string().email()),
    password: coerceText(z.string().min(5)),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  await ensureSeedUser();
  const json = await req.json().catch(() => null);
  console.log('REGISTER raw body:', json);
  // Some clients (old bundle) send the entire payload nested under "email"
  const normalized = (json && typeof json === 'object' && json !== null && typeof (json as any).email === 'object')
    ? (json as any).email
    : json;
  const parsed = RegisterSchema.safeParse(normalized);
  if (!parsed.success) {
    return Response.json(
      {
        error: 'Invalid body',
        issues: parsed.error.issues?.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 }
    );
  }
  const { email, password, username } = parsed.data;
  const uname = username?.trim();

  if (getUserByEmail(email)) {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }

  if (uname && getUserByUsername(uname)) {
    return Response.json({ error: 'Username already taken' }, { status: 409 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = createUserWithEmail(email, passwordHash, uname);
    const token = await signJwt({ sub: String(user.id), username: user.username, email: user.email });
    return Response.json({ token });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes('UNIQUE') && msg.includes('users.username')) {
      return Response.json({ error: 'Username already taken' }, { status: 409 });
    }
    if (msg.includes('UNIQUE') && msg.includes('users.email')) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.error('REGISTER error', e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}


