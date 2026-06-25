import pg from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'
const candidates = []
try { candidates.push(JSON.parse(fs.readFileSync('dev/config/settings.json','utf8')).ENCRYPTION_KEY) } catch {}
const c = new pg.Client({ host:'127.0.0.1', port:5432, user:'postgres', password:'postgres', database:'activepieces' })
await c.connect()
const r = await c.query("select auth from ai_provider where provider='openrouter'")
await c.end()
const auth = r.rows[0].auth
for (const k of candidates) {
  try {
    const d = crypto.createDecipheriv('aes-256-cbc', Buffer.from(k,'binary'), Buffer.from(auth.iv,'hex'))
    let o = d.update(Buffer.from(auth.data,'hex'),undefined,'utf8'); o += d.final('utf8')
    const p = JSON.parse(o); const key = p.apiKey ?? p.key ?? p.token
    if (key) { process.stdout.write(key); process.exit(0) }
  } catch {}
}
process.exit(1)
