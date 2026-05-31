import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { key, instance_id, ...settings } = req.body
  
  const { data: keyData } = await supabase
    .from('bot_keys')
    .select('used_by')
    .eq('key', key)
    .eq('status', 'used')
    .single()
  
  const { data: instance } = await supabase
    .from('b_instances')
    .select('id')
    .eq('instance_id', instance_id)
    .eq('id', keyData?.used_by)
    .single()
  
  if (!instance) return res.status(403).json({ error: 'Unauthorized' })

  // Convert comma-separated strings into arrays to prevent "malformed array literal" errors
  if (settings.allowed_dms && typeof settings.allowed_dms === 'string') {
    settings.allowed_dms = settings.allowed_dms.split(',').map(n => n.trim()).filter(Boolean)
  }

  if (settings.allowed_groups && typeof settings.allowed_groups === 'string') {
    settings.allowed_groups = settings.allowed_groups.split(',').map(g => g.trim()).filter(Boolean)
  }

  if (settings.restricted_categories && typeof settings.restricted_categories === 'string') {
    settings.restricted_categories = settings.restricted_categories.split(',').map(c => c.trim()).filter(Boolean)
  }

  if (settings.vip_numbers && typeof settings.vip_numbers === 'string') {
    settings.vip_numbers = settings.vip_numbers.split(',').map(v => v.trim()).filter(Boolean)
  }

  const { error } = await supabase.from('b_settings').update({
    ...settings,
    updated_at: new Date()
  }).eq('id', instance_id)

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ success: true })
}
