<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DGIFT Bot Admin Panel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    body {
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #38bdf8;
    }
    .card {
      background: #1e293b;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    h2 {
      margin-bottom: 20px;
      color: #f8fafc;
    }
    input, button {
      width: 100%;
      padding: 12px;
      margin-bottom: 15px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
    }
    input {
      background: #334155;
      color: #e2e8f0;
      outline: none;
    }
    input:focus {
      outline: 2px solid #38bdf8;
    }
    button {
      background: #38bdf8;
      color: #0f172a;
      font-weight: bold;
      cursor: pointer;
      transition: 0.2s;
    }
    button:hover {
      background: #0ea5e9;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .message {
      padding: 12px;
      border-radius: 8px;
      margin-top: 10px;
      display: none;
    }
    .success {
      background: #166534;
      color: #bbf7d0;
    }
    .error {
      background: #991b1b;
      color: #fecaca;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      overflow-x: auto;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #334155;
      word-break: break-all;
    }
    th {
      color: #94a3b8;
    }
    .status-available { color: #4ade80; }
    .status-sold { color: #f87171; }
    .status-off { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>DGIFT Bot Admin Panel</h1>
    
    <div class="card">
      <h2>Add New Bot</h2>
      <input type="text" id="id" placeholder="Bot ID / INSTANCE_ID" required>
      <input type="text" id="bot_name" placeholder="Bot Name" required>
      <input type="text" id="image_url" placeholder="Image URL from ibb.co">
      <input type="text" id="secret_key" placeholder="Secret Key" required>
      <input type="text" id="render_link" placeholder="Render Deploy Link">
      <button id="addBtn" onclick="addBot()">Add Bot</button>
      <div id="message" class="message"></div>
    </div>

    <div class="card">
      <h2>All Bots</h2>
      <button onclick="loadBots()">Refresh List</button>
      <table id="botsTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Secret Key</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>

  <script>
    async function addBot() {
      const btn = document.getElementById('addBtn')
      const data = {
        id: document.getElementById('id').value.trim(),
        bot_name: document.getElementById('bot_name').value.trim(),
        image_url: document.getElementById('image_url').value.trim(),
        secret_key: document.getElementById('secret_key').value.trim(),
        render_link: document.getElementById('render_link').value.trim()
      }

      if (!data.id || !data.bot_name || !data.secret_key) {
        showMessage('ID, Name na Secret Key ni lazima', false)
        return
      }

      btn.disabled = true
      btn.textContent = 'Adding...'

      try {
        const res = await fetch('/api/add-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const result = await res.json()
        showMessage(result.success ? 'Bot added successfully!' : result.error, result.success)
        
        if (result.success) {
          document.getElementById('id').value = ''
          document.getElementById('bot_name').value = ''
          document.getElementById('image_url').value = ''
          document.getElementById('secret_key').value = ''
          document.getElementById('render_link').value = ''
          loadBots()
        }
      } catch (err) {
        showMessage('Network error', false)
      } finally {
        btn.disabled = false
        btn.textContent = 'Add Bot'
      }
    }

    async function loadBots() {
      try {
        const res = await fetch('/api/bots')
        const result = await res.json()
        const tbody = document.querySelector('#botsTable tbody')
        tbody.innerHTML = ''

        if (!result.bots || result.bots.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No bots yet</td></tr>'
          return
        }

        result.bots.forEach(bot => {
          tbody.innerHTML += `
            <tr>
              <td>${bot.id}</td>
              <td>${bot.bot_name}</td>
              <td class="status-${bot.status}">${bot.status}</td>
              <td>${bot.secret_key || 'N/A'}</td>
            </tr>
          `
        })
      } catch (err) {
        showMessage('Failed to load bots', false)
      }
    }

    function showMessage(msg, isSuccess) {
      const div = document.getElementById('message')
      div.textContent = msg
      div.className = 'message ' + (isSuccess ? 'success' : 'error')
      div.style.display = 'block'
      setTimeout(() => div.style.display = 'none', 3000)
    }

    loadBots()
  </script>
</body>
</html>
