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

  // Clean up empty strings for UUID/JSON/Numeric fields to prevent DB crashes
  Object.keys(settings).forEach(fieldKey => {
    if (typeof settings[fieldKey] === 'string' && settings[fieldKey].trim() === '') {
      settings[fieldKey] = null
    }
  })

  // Handle allowed_dms Array
  if (typeof settings.allowed_dms === 'string') {
    if (settings.allowed_dms.trim() === '') {
      settings.allowed_dms = []
    } else {
      settings.allowed_dms = settings.allowed_dms.split(',').map(n => n.trim()).filter(Boolean)
    }
  } else if (settings.allowed_dms === null) {
    settings.allowed_dms = []
  }

  // Handle allowed_groups Array
  if (typeof settings.allowed_groups === 'string') {
    if (settings.allowed_groups.trim() === '') {
      settings.allowed_groups = []
    } else {
      settings.allowed_groups = settings.allowed_groups.split(',').map(g => g.trim()).filter(Boolean)
    }
  } else if (settings.allowed_groups === null) {
    settings.allowed_groups = []
  }

  // Handle restricted_categories Array
  if (typeof settings.restricted_categories === 'string') {
    if (settings.restricted_categories.trim() === '') {
      settings.restricted_categories = []
    } else {
      settings.restricted_categories = settings.restricted_categories.split(',').map(c => c.trim()).filter(Boolean)
    }
  } else if (settings.restricted_categories === null) {
    settings.restricted_categories = []
  }

  // Handle vip_numbers Array
  if (typeof settings.vip_numbers === 'string') {
    if (settings.vip_numbers.trim() === '') {
      settings.vip_numbers = []
    } else {
      settings.vip_numbers = settings.vip_numbers.split(',').map(v => v.trim()).filter(Boolean)
    }
  } else if (settings.vip_numbers === null) {
    settings.vip_numbers = []
  }

  const { error } = await supabase.from('b_settings').update({
    ...settings,
    updated_at: new Date()
  }).eq('id', instance_id)

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ success: true })
}
