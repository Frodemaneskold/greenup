import { supabase } from '@/src/lib/supabase';

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
};

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return [];
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('id,user_id,type,title,body,metadata,read_at,created_at')
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToNotifications(onInsert: (row: NotificationRow) => void): () => void {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  (async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      channel = supabase
        .channel('realtime:notifications:' + uid)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          (payload) => {
            const newRow = payload.new as NotificationRow;
            onInsert(newRow);
          }
        )
        .subscribe();
    } catch {
      // ignore
    }
  })();
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}


