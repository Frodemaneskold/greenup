import { isValidEmail, isValidUsername, type InviteTarget } from './users-store';
import { addParticipant } from './competitions-store';

export type Invite = {
  id: string;
  competitionId: string;
  target: InviteTarget;
  status: 'pending' | 'accepted' | 'declined';
};

let invites: Invite[] = [];

type Listener = (current: Invite[]) => void;
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...invites];
  listeners.forEach((l) => l(snapshot));
}

export function subscribeInvites(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingInvitesForCompetition(competitionId: string): Invite[] {
  return invites.filter((i) => i.competitionId === competitionId && i.status === 'pending');
}

export function addPendingInvites(competitionId: string, targets: InviteTarget[]) {
  const newOnes: Invite[] = targets.map((t) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    competitionId,
    target: t,
    status: 'pending',
  }));
  invites = [...newOnes, ...invites];
  notify();
}

// For demo: accept an invite and add participant to the competition
export function acceptInvite(inviteId: string) {
  const inv = invites.find((i) => i.id === inviteId);
  if (!inv) return;
  if (inv.status !== 'pending') return;

  inv.status = 'accepted';

  // Derive a display name
  let name = 'Okänd';
  if (inv.target.type === 'friend') {
    // Represent friend as placeholder name; in real app we would look it up
    name = `Vän ${inv.target.userId}`;
  } else if (inv.target.type === 'email') {
    name = inv.target.email.split('@')[0];
  } else if (inv.target.type === 'username') {
    name = inv.target.username;
  }
  name = name.charAt(0).toUpperCase() + name.slice(1);

  addParticipant(inv.competitionId, {
    id: `u-${Math.random().toString(36).slice(2, 7)}`,
    name,
    co2ReducedKg: 0,
  });

  notify();
}

// For demo: decline an invite, do not add participant
export function declineInvite(inviteId: string) {
  const inv = invites.find((i) => i.id === inviteId);
  if (!inv) return;
  if (inv.status !== 'pending') return;
  inv.status = 'declined';
  notify();
}


