import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ error: 'Key is required' })
    }

    const { data, error } = await supabase
      .from('bot_keys')
      .select('key, status')
      .eq('key', key)
      .eq('status', 'unused')
      .single()

    if (error || !data) {
      return res.status(400).json({ error: 'Invalid or already used key' })
    }

    res.status(200).json({ valid: true, key: data.key })
    
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}