import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    const { k } = req.query

    if (!k) {
      return res.status(400).send('Key missing')
    }

    // 1. Pata key na angalia kama ni valid
    const { data: keyData, error: keyError } = await supabase
      .from('bot_keys')
      .select('key, status, used_by')
      .eq('key', k)
      .single()

    if (keyError || !keyData || keyData.status !== 'used') {
      return res.status(403).send('Invalid or unused key')
    }

    // 2. Pata instance iliyo linked na key hii
    const { data: instance, error: instError } = await supabase
      .from('b_instances')
      .select('render_url')
      .eq('id', keyData.used_by)
      .single()

    if (instError || !instance) {
      return res.status(404).send('Instance not found')
    }

    // 3. Redirect siri kwa render_url
    res.redirect(302, instance.render_url)
    
  } catch (err) {
    res.status(500).send('Server error')
  }
}