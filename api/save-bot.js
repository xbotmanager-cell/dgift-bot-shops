import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      bot_id,
      key,
      bot_name,
      owner_name,
      owner_number,
      imgbb_url,
      welcome_msg,
      auto_reply
    } = req.body;

    if (!bot_id || !key) {
      return res.status(400).json({ error: 'Missing bot_id or key' });
    }

    // 1. Verify key matches bot_id and is used
    const { data: keyData, error: keyError } = await supabase
      .from('b_instances')
      .select('id, status')
      .eq('id', bot_id)
      .eq('key', key)
      .eq('status', 'used')
      .single();

    if (keyError || !keyData) {
      return res.status(403).json({ error: 'Invalid key or bot' });
    }

    // 2. Prepare update object for b_instances
    const instanceUpdate = {};
    if (bot_name) instanceUpdate.bot_name = bot_name;
    if (owner_name) instanceUpdate.owner_name = owner_name;
    if (owner_number) instanceUpdate.owner_number = owner_number;
    if (imgbb_url) instanceUpdate.imgbb_url = imgbb_url;

    // 3. Update b_instances if there is data
    if (Object.keys(instanceUpdate).length > 0) {
      const { error: instError } = await supabase
        .from('b_instances')
        .update(instanceUpdate)
        .eq('id', bot_id)
        .eq('key', key);

      if (instError) {
        return res.status(500).json({ error: 'Failed to update b_instances', detail: instError.message });
      }
    }

    // 4. Prepare update object for b_settings
    const settingsUpdate = {};
    if (bot_name) settingsUpdate.bot_name = bot_name;
    if (imgbb_url) settingsUpdate.imgbb_url = imgbb_url;
    if (welcome_msg) settingsUpdate.welcome_msg = welcome_msg;
    if (auto_reply) settingsUpdate.auto_reply = auto_reply;

    // 5. Update b_settings if there is data
    if (Object.keys(settingsUpdate).length > 0) {
      const { error: setError } = await supabase
        .from('b_settings')
        .update(settingsUpdate)
        .eq('bot_id', bot_id);

      if (setError) {
        return res.status(500).json({ error: 'Failed to update b_settings', detail: setError.message });
      }
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('save-bot error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}