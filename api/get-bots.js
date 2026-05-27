import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    // 1. Chukua bots zote zilizonunuliwa
    const { data: bots, error } = await supabase
      .from('b_instances')
      .select('id, instance_id, bot_name, owner_name, owner_number, imgbb_url, status, render_url')
      .eq('status', 'used')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    if (!bots || bots.length === 0) {
      return res.status(200).json([])
    }

    // 2. Chukua sessions zote ili kuangalia ni ipi imepair
    const { data: sessions } = await supabase
      .from('bu_sessions')
      .select('id')

    const pairedIds = sessions ? sessions.map(s => s.id) : []

    // 3. Weka status online/offline kwenye kila bot
    const botsWithStatus = bots.map(bot => ({
      ...bot,
      online: pairedIds.includes(bot.instance_id)
    }))

    res.status(200).json(botsWithStatus)
    
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}