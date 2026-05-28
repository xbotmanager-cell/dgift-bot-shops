import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get ALL bots from b_settings
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

    // Get all sessions from bu_sessions
    const { data: sessions, error: sessionsErr } = await supabase
      .from('bu_sessions')
      .select('instance_id, status, updated_at')

    if (sessionsErr) {
      return res.status(500).json({ error: sessionsErr.message })
    }

    // Build session map for fast lookup
    const sessionMap = new Map()
    sessions?.forEach(s => {
      sessionMap.set(s.instance_id, {
        status: s.status,
        updated_at: s.updated_at
      })
    })

    // Map bots with online status and correct image field
    const bots = settings.map(bot => {
      const session = sessionMap.get(bot.id)
      const isOnline = session && session.status === 'used' && isRecent(session.updated_at)

      return {
        id: bot.id,
        bot_name: bot.botname || 'Unnamed Bot',
        owner_name: bot.owner_name || 'Anonymous',
        owner_number: bot.owner_number || 'N/A',
        imgbb_url: bot.startup_image || null,
        online: isOnline,
        last_seen: session?.updated_at || null
      }
    })

    return res.status(200).json(bots)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// Check if session was updated in last 2 minutes
function isRecent(timestamp) {
  if (!timestamp) return false
  const lastSeen = new Date(timestamp).getTime()
  const now = Date.now()
  const twoMinutes = 2 * 60 * 1000
  return (now - lastSeen) < twoMinutes
}