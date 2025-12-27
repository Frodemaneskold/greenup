import bcrypt from 'bcryptjs';

export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(plainText, saltRounds);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}
