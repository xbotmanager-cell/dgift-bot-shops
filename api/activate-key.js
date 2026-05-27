import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { key } = req.body
  if (!key) return res.status(400).json({ error: 'Key required' })

  const { data: keyData, error: keyErr } = await supabase
    .from('bot_keys')
    .select('*')
    .eq('key', key)
    .eq('status', 'unused')
    .single()
  
  if (keyErr || !keyData) return res.status(403).json({ error: 'Invalid or used key' })

  const { data: instance, error: instErr } = await supabase
    .from('b_instances')
    .select('*')
    .eq('status', 'unavailable')
    .limit(1)
    .single()
  
  if (instErr || !instance) return res.status(503).json({ error: 'No slots available' })

  await supabase.from('b_instances').update({ status: 'used' }).eq('id', instance.id)
  await supabase.from('bot_keys').update({ status: 'used', used_by: instance.id }).eq('key', key)

  await supabase.from('b_settings').upsert({ 
    id: instance.instance_id,
    botname: instance.bot_name || 'dgift-bot',
    prefix: '.',
    public_mode: false,
    antilink: false,
    antispam: false,
    autoread: false,
    autotyping: false,
    autoviewstatus: false,
    startup_image: 'https://i.ibb.co/1tM9QHF9/IMG-20260525-WA0076.jpg'
  }, { onConflict: 'id' })

  return res.json({ success: true, instance_id: instance.instance_id })
}