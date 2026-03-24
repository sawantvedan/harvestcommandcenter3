import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zxhopgnpcuadyxavudyt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aG9wZ25wY3VhZHl4YXZ1ZHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjc0NjEsImV4cCI6MjA4OTkwMzQ2MX0.DLJoIm3Y8NTrnkhuS8OV0nJwNNPmibGWwULIu-k_B6E'

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
  } catch { return null }
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
```

Once you've done all 3 files in `src/` and deleted the loose `App.jsx` and `main.jsx` from root, your repo should look like:
```
index.html
package.json
vite.config.js
src/
  App.jsx
  main.jsx
  supabase.js
