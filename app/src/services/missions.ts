import { supabase } from '@/src/lib/supabase';

export type Mission = {
  id: string;
  title: string;
  category: string;
  co2_kg: number;
  max_per_day: number;
  description?: string | null;
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('id,title,category,co2_kg,max_per_day,description')
    .order('category', { ascending: true })
    .order('title', { ascending: true });
  if (error) {
    // Surface a clean error; callers can show an empty state on failure
    throw new Error(error.message);
  }
  return (data ?? []) as Mission[];
}

export async function fetchTodayCounts(missionIds: string[]): Promise<Record<string, number>> {
  if (!missionIds.length) return {};
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {};
  }
  const userId = userData.user.id;
  const sinceIso = startOfTodayIso();
  const { data, error } = await supabase
    .from('user_actions')
    .select('mission_id, created_at')
    .eq('user_id', userId)
    .in('mission_id', missionIds)
    .gte('created_at', sinceIso);
  // If the table doesn't exist yet or RLS blocks, treat as zero counts so UI still renders missions.
  if (error) return {};
  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { mission_id: string }) => {
    counts[row.mission_id] = (counts[row.mission_id] ?? 0) + 1;
  });
  // Ensure every mission id is present with at least 0
  for (const id of missionIds) {
    if (counts[id] == null) counts[id] = 0;
  }
  return counts;
}

export async function logUserAction(mission: Mission): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Du måste vara inloggad för att utföra uppdrag.');
  }
  const userId = userData.user.id;
  const { error } = await supabase.from('user_actions').insert({
    user_id: userId,
    mission_id: mission.id,
    co2_saved_kg: mission.co2_kg,
  });
  if (error) {
    throw new Error(error.message);
  }
}


