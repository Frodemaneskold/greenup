import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return encoder.encode(secret);
}

export async function signJwt(payload: Record<string, unknown>, expiresIn = '7d'): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyJwt<T = unknown>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as T;
}
