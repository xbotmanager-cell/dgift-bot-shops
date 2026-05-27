import { createClient } from '@supabase/supabase-js'

// Securely instantiate the Supabase environment connection
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enforce global Cross-Origin Resource Sharing (CORS) safety headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Intercept and clear out browser preflight OPTIONS handshakes instantly
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Rigid protection vector to allow only authorized POST ingestion pipelines
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  // Extract necessary variables from the incoming secure body request payload
  const { id, bot_name, image_url, secret_key, render_link, price } = req.body

  // Perform rigorous structural verification checks on core database values
  if (!id || !bot_name || !secret_key || !render_link || !price) {
    return res.status(400).json({ 
      error: 'Missing parameters. id, bot_name, secret_key, render_link, and price are strictly required.' 
    })
  }

  try {
    // Ingest the new bot record directly into the Supabase data matrix rows
    const { data, error } = await supabase
      .from('bots')
      .insert([
        {
          id,
          bot_name,
          image_url,
          secret_key,
          render_link,
          price: parseFloat(price), // Ensures the numerical price mapping matches database data types
          status: 'available',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      throw error
    }

    // Acknowledge record creation successfully to the admin panel pipeline interface
    return res.status(200).json({ success: true, message: 'New bot successfully populated to storefront', bot: data[0] })

  } catch (err) {
    console.error('[VERCEL API ERROR - ADD BOT]:', err.message)
    return res.status(500).json({ success: false, error: 'Database pipeline row registration entry failure' })
  }
}
