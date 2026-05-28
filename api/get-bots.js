import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Chukua bots zote
    const { data: settings, error: settingsErr } = await supabase
      .from('b_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (settingsErr) {
      return res.status(500).json({ error: settingsErr.message })
    }

    if (!settings || settings.length === 0) {
      return res.status(200).json([])
    }

    // Chukua sessions zote
    const { data: sessions, error: sessionsErr } = await supabase
      .from('bu_sessions')
      .select('id, updated_at')

    if (sessionsErr) {
      return res.status(500).json({ error: sessionsErr.message })
    }

    // Weka sessions kwenye map kwa ajili ya match haraka
    const sessionMap = new Map()
    sessions?.forEach(s => {
      sessionMap.set(s.id, s.updated_at)
    })

    // Pangia bots na status
    const bots = settings.map(bot => {
      const lastSeen = sessionMap.get(bot.id)
      const isOnline = lastSeen ? isRecent(lastSeen) : false

      return {
        id: bot.id,
        bot_name: bot.botname || 'Unnamed Bot',
        owner_name: bot.owner_name || 'Anonymous',
        owner_number: bot.owner_number || 'N/A',
        imgbb_url: bot.startup_image || null,
        online: isOnline,
        last_seen: lastSeen || null
      }
    })

    return res.status(200).json(bots)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// Check kama session imeupdate ndani ya dakika 10
function isRecent(timestamp) {
  if (!timestamp) return false
  const lastSeen = new Date(timestamp).getTime()
  const now = Date.now()
  const tenMinutes = 10 * 60 * 1000
  return (now - lastSeen) < tenMinutes
}