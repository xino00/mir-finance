import { supabase } from './supabase';
import type { AppState } from '../types';

/**
 * Upserts the full app state for the authenticated user.
 * Uses a single row per user in the `user_data` table.
 */
export async function pushToSupabase(userId: string, state: AppState): Promise<void> {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data: state as unknown as import('./database.types').Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

/**
 * Fetches the full app state for the authenticated user.
 * Returns null if no data exists yet.
 */
export async function pullFromSupabase(userId: string): Promise<AppState | null> {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }
  return data?.data as unknown as AppState ?? null;
}
