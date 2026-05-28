import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { key, instance_id } = req.query
    if (!key || !instance_id) {
      return res.status(400).json({ error: 'Missing params' })
    }

    // Verify key
    const { data: keyData, error: keyErr } = await supabase
      .from('bot_keys')
      .select('used_by')
      .eq('key', key)
      .eq('status', 'used')
      .single()

    if (keyErr || !keyData) {
      return res.status(403).json({ error: 'Invalid key' })
    }

    // Verify instance belongs to key
    const { data: instance, error: instErr } = await supabase
      .from('b_instances')
      .select('id')
      .eq('instance_id', instance_id)
      .eq('id', keyData.used_by)
      .single()

    if (instErr || !instance) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Get ALL settings, no filtering, no type casting
    const { data: settings, error: setErr } = await supabase
      .from('b_settings')
      .select('*')
      .eq('id', instance_id)
      .maybeSingle()

    if (setErr) {
      return res.status(500).json({ error: setErr.message })
    }

    // Return raw row as-is. Booleans stay boolean, JSON stays JSON, timestamps stay string
    return res.status(200).json(settings || {})
    
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}