import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zxhoppgncuadyxavudyt.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const USER_ID = 'vedan_main'

export async function loadFromSupabase(key) {
  try {
    const { data, error } = await supabase
      .from('command_center')
      .select('data')
      .eq('id', `${USER_ID}_${key}`)
      .single()

    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

export async function saveToSupabase(key, value) {
  try {
    await supabase
      .from('command_center')
      .upsert({
        id: `${USER_ID}_${key}`,
        user_id: USER_ID,
        data: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
  } catch {}
}
