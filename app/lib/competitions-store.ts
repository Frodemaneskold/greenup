import { currentUser } from './users-store';

export type Participant = {
  id: string;
  name: string;
  co2ReducedKg: number;
};

export type Competition = {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  participants: Participant[];
  updatedAt: string; // YYYY-MM-DD
};

let competitions: Competition[] = [
  {
    id: '1',
    name: 'Kompisligan',
    description: 'Vännernas utmaning',
    startDate: undefined,
    endDate: undefined,
    participants: [
      { id: 'me', name: 'Du', co2ReducedKg: 42.2 },
      { id: '2', name: 'Anna Svensson', co2ReducedKg: 37.9 },
      { id: '3', name: 'Leo Nilsson', co2ReducedKg: 15.3 },
      { id: '4', name: 'Maja Karlsson', co2ReducedKg: 9.7 },
    ],
    updatedAt: '2025-11-10',
  },
  {
    id: '2',
    name: 'Jobbteamet',
    description: 'Kontorets CO₂-race',
    startDate: undefined,
    endDate: undefined,
    participants: [
      { id: 'me', name: 'Du', co2ReducedKg: 12.5 },
      { id: '2', name: 'Anna Svensson', co2ReducedKg: 5.4 },
    ],
    updatedAt: '2025-11-09',
  },
];

type Listener = (current: Competition[]) => void;
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...competitions];
  listeners.forEach((l) => l(snapshot));
}

export function getCompetitions(): Competition[] {
  return competitions;
}

export function getCompetitionById(id: string): Competition | undefined {
  return competitions.find((c) => c.id === id);
}

export function createCompetition(input: {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const updatedAt = `${yyyy}-${mm}-${dd}`;
  const newComp: Competition = {
    id: input.id,
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    participants: [{ id: currentUser.id, name: currentUser.name, co2ReducedKg: 0 }],
    updatedAt,
  };
  competitions = [newComp, ...competitions];
  notify();
  return newComp;
}

export function addParticipant(competitionId: string, participant: Participant) {
  const comp = competitions.find((c) => c.id === competitionId);
  if (!comp) return;
  // Avoid duplicates by id
  if (comp.participants.some((p) => p.id === participant.id)) return;
  comp.participants = [...comp.participants, participant];
  // Update timestamp
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  comp.updatedAt = `${yyyy}-${mm}-${dd}`;
  notify();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}


