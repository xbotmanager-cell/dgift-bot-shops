import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  const { bot_id } = req.query

  if (!bot_id) return res.status(400).json({ error: 'Missing bot_id' })

  // Pata data kutoka b_instances na b_settings kwa pamoja
  const [instanceRes, settingsRes] = await Promise.all([
    supabase.from('b_instances').select('*').eq('id', bot_id).single(),
    supabase.from('b_settings').select('*').eq('bot_id', bot_id).single()
  ])

  if (instanceRes.error && settingsRes.error) {
    return res.status(404).json({ error: 'Bot not found' })
  }

  const instance = instanceRes.data || {}
  const settings = settingsRes.data || {}

  // Merge: settings za b_settings zina override b_instances
  return res.json({
    bot_name: settings.bot_name || instance.bot_name,
    owner_name: instance.owner_name,
    owner_number: instance.owner_number,
    imgbb_url: settings.imgbb_url || instance.imgbb_url,
    welcome_msg: settings.welcome_msg,
    auto_reply: settings.auto_reply,
    status: settings.status || 'offline'
  })
}