import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { secret_key } = req.body

  if (!secret_key) {
    return res.status(400).json({ error: 'Secret key is required' })
  }

  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('secret_key', secret_key)
    .eq('status', 'available')
    .single()

  if (error || !bot) {
    return res.status(404).json({ error: 'Invalid or used key' })
  }

  await supabase
    .from('bots')
    .update({ 
      status: 'sold', 
      sold_at: new Date().toISOString()
    })
    .eq('id', bot.id)

  res.status(200).json({ 
    success: true, 
    message: 'Bot activated!',
    bot_name: bot.bot_name,
    render_link: bot.render_link
  })
}
