// Resumable per-S3-key ledger (append-friendly JSONL). The key is the natural idempotency token:
// it is exactly what the builder produces, the resolver consults (objectExists), and the installer
// downloads. A crashed run is re-invoked — done keys are skipped, pending/failed are retried.
const fs = require('node:fs')

function openLedger(filePath) {
  const records = new Map()
  if (fs.existsSync(filePath)) {
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      if (!line.trim()) {
        continue
      }
      try {
        const rec = JSON.parse(line)
        records.set(rec.key, rec) // later lines win — last write per key is the live state
      }
      catch { /* skip corrupt line */ }
    }
  }
  function append(rec) {
    const merged = { ...(records.get(rec.key) || {}), ...rec, at: rec.at || isoNow() }
    records.set(rec.key, merged)
    fs.appendFileSync(filePath, JSON.stringify(merged) + '\n')
    return merged
  }
  return {
    get: (key) => records.get(key) || null,
    status: (key) => (records.get(key) || {}).status || null,
    all: () => [...records.values()],
    count: (status) => [...records.values()].filter((r) => r.status === status).length,
    set: append,
  }
}

// Date.now is fine in a normal script (only forbidden inside workflow scripts).
function isoNow() {
  return new Date().toISOString()
}

module.exports = { openLedger }
