export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export const currentUser: User = {
  id: 'me',
  name: 'Du',
  username: 'du',
  email: 'du@example.com',
};

const sampleFriends: User[] = [
  { id: '2', name: 'Anna Svensson', username: 'anna', email: 'anna@example.com' },
  { id: '3', name: 'Leo Nilsson', username: 'leo', email: 'leo@example.com' },
  { id: '4', name: 'Maja Karlsson', username: 'maja', email: 'maja@example.com' },
];

export function getFriends(): User[] {
  return sampleFriends;
}

export function isValidEmail(email: string): boolean {
  // Simple validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_\.]{3,}$/.test(username);
}

export type InviteTarget =
  | { type: 'friend'; userId: string }
  | { type: 'email'; email: string }
  | { type: 'username'; username: string };

export async function sendInvites(_competitionId: string, _targets: InviteTarget[]): Promise<void> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 500));
  // In a real app, send to backend
}


