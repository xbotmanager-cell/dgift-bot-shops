import { createClient } from '@supabase/supabase-js'

// Initialize the secure connection layer to Supabase database securely
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Inject global Cross-Origin Resource Sharing (CORS) rules for dashboard interactions
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle options preflight checks immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Authorize only POST method requests to alter the database configuration values
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    // DYNAMIC EXTRACTION LAYER: Separate instance_id and capture EVERY other incoming field dynamically
    const { instance_id, ...dynamicPayload } = req.body

    // Validation checkpoint: Enforce that an instance identifier must be supplied
    if (!instance_id) {
      return res.status(400).json({ error: 'Missing parameter: "instance_id" is strictly required to route modifications.' })
    }

    // Append the standard system modification timestamp automatically to the object array
    dynamicPayload.updated_at = new Date().toISOString()

    // Perform a fully dynamic update execution query matching whatever configuration payload was sent from the panel front-end
    const { data, error } = await supabase
      .from('b_settings')
      .update(dynamicPayload)
      .eq('id', instance_id)
      .select()

    if (error) {
      throw error
    }

    // Return success validation response logs back to the user panel interface matrix dynamically
    return res.status(200).json({ 
      success: true, 
      message: `Configuration profiles for instance ${instance_id} dynamically synchronized successfully.`, 
      updated_settings: data[0] 
    })

  } catch (err) {
    console.error('[VERCEL API ERROR - DYNAMIC UPDATE SETTINGS]:', err.message)
    return res.status(500).json({ success: false, error: 'Database pipeline runtime entry flexible modification failure' })
  }
}
