import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { bot_id, status } = req.body

  if (!bot_id || !status) return res.status(400).json({ error: 'Missing data' })

  const { error } = await supabase
    .from('b_settings')
    .update({ status })
    .eq('bot_id', bot_id)

  if (error) return res.status(500).json({ error: error.message })

  return res.json({ success: true })
}