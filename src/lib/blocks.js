import { supabase } from './supabase'

// Returns an array of user IDs that `userId` has blocked.
// Used to filter blocked authors out of feeds/search results.
export async function getBlockedIds(userId) {
  if (!userId) return []
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId)
  if (error) {
    console.error(error)
    return []
  }
  return (data || []).map((row) => row.blocked_id)
}