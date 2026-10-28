import type { ProfileRow } from '@pocketnexus/database';
import { appError, err, ok, type Result } from '@pocketnexus/shared';
import { getSupabase } from '@/lib/supabase';

export async function fetchOwnProfile(userId: string): Promise<Result<ProfileRow>> {
  const client = getSupabase();
  if (!client) return err(appError('not_configured'));
  const { data, error } = await (await client)
    .from('profiles')
    .select('id, username, display_name, bio, avatar_path, visibility, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) return err(appError('unknown', 'We could not load your profile.'));
  if (!data) {
    // The DB trigger creates the profile at sign-up; absence means something
    // went wrong server-side rather than "new user".
    return err(appError('not_found', 'Your profile has not been initialised yet. Please try again shortly.'));
  }
  return ok(data);
}
