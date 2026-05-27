import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  const { key, instance_id } = req.query
  if (!key || !instance_id) return res.status(400).json({ error: 'Missing params' })

  const { data: keyData } = await supabase
    .from('bot_keys')
    .select('used_by')
    .eq('key', key)
    .eq('status', 'used')
    .single()
  
  const { data: instance } = await supabase
    .from('b_instances')
    .select('instance_id, render_url, imgbb_url')
    .eq('instance_id', instance_id)
    .eq('id', keyData?.used_by)
    .single()
  
  if (!instance) return res.status(403).json({ error: 'Unauthorized' })
  
  return res.json(instance)
}