import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase Client securely using environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS handling for secure frontend cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Respond immediately to preflight browser options queries
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Enforce rigid REST method access checks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  try {
    // SECURITY PATCH: Explicitly omitted 'render_link' and 'secret_key' to prevent code leakage
    const { data, error } = await supabase
      .from('bots')
      .select('id, bot_name, image_url, status, price')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Return the sanitized list of bots safely to the storefront frontend matrix
    return res.status(200).json({ success: true, bots: data })

  } catch (err) {
    console.error('[VERCEL API ERROR - GET BOTS]:', err.message)
    return res.status(500).json({ success: false, error: 'Database pipeline query extraction failure' })
  }
}
