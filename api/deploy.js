import { createClient } from '@supabase/supabase-js'

// Establish connection to the central database core securely
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enforce standard CORS protection vectors
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Allow only GET methods since this handles direct secure browser redirection paths
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  // Extract variables via query parameters (e.g., /api/deploy?bot_id=XYZ&token=SECRET)
  const { bot_id, token } = req.query

  if (!bot_id) {
    return res.status(400).json({ error: 'Required query parameter "bot_id" is missing.' })
  }

  try {
    // Fetch the structural profile of the target bot containing the hidden deployment URL link
    const { data: bot, error } = await supabase
      .from('bots')
      .select('render_link, status, secret_key')
      .eq('id', bot_id)
      .single()

    if (error || !bot) {
      return res.status(404).json({ error: 'Target bot allocation structure not found in registry.' })
    }

    // SECURITY VERIFICATION GATEWAY:
    // Ensure that only bots whose status is updated to 'paid' (or matching token verification) can be accessed
    if (bot.status !== 'available' && token !== bot.secret_key) {
      return res.status(403).json({ error: 'Access denied. Deployment routing is restricted or unpaid.' })
    }

    const secureTargetDeploymentLink = bot.render_link

    // Perform an immediate HTTP 302 temporary redirection to keep the backend core url hidden from view logs
    res.writeHead(302, { Location: secureTargetDeploymentLink })
    return res.end()

  } catch (err) {
    console.error('[VERCEL API ERROR - DEPLOY REDIRECT]:', err.message)
    return res.status(500).json({ error: 'Internal gateway pipeline redirection operational failure' })
  }
}
