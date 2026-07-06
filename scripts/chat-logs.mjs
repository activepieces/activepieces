#!/usr/bin/env node
// Reconstruct a chat run end-to-end from the local evlog filesystem drain.
//
// Usage:
//   node scripts/chat-logs.mjs <conversationId> [runId]
//   npm run chat:logs -- <conversationId> [runId]
//
// Reads .evlog/logs/*.jsonl (written when LOG_FILE=true / AP_LOG_FILE=true),
// merges api + worker + web (source:"client") events for the conversation,
// sorts by timestamp, and prints a unified timeline.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , conversationId, runId] = process.argv

if (!conversationId) {
    console.error('Usage: node scripts/chat-logs.mjs <conversationId> [runId]')
    process.exit(1)
}

const logsDir = join(process.cwd(), '.evlog', 'logs')

let files = []
try {
    files = readdirSync(logsDir).filter((f) => f.endsWith('.jsonl'))
}
catch {
    console.error(`No logs found at ${logsDir}. Run with LOG_FILE=true / AP_LOG_FILE=true and trigger a chat turn first.`)
    process.exit(1)
}

const events = []
for (const file of files) {
    const content = readFileSync(join(logsDir, file), 'utf8')
    for (const line of content.split('\n')) {
        if (line.trim().length === 0) continue
        let event
        try {
            event = JSON.parse(line)
        }
        catch {
            continue
        }
        if (event?.conversation?.id !== conversationId) continue
        if (runId && event?.run?.id !== runId) continue
        events.push(event)
    }
}

events.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))

const RESERVED = new Set(['timestamp', 'level', 'service', 'source', 'msg', 'conversation', 'run'])

for (const event of events) {
    const ts = event.timestamp ?? ''
    const level = String(event.level ?? 'info').toUpperCase().padEnd(5)
    const service = (event.source === 'client' ? 'web' : (event.service ?? 'unknown')).replace('activepieces-', '')
    const rest = {}
    for (const [key, value] of Object.entries(event)) {
        if (!RESERVED.has(key)) rest[key] = value
    }
    const extra = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
    console.log(`${ts} [${service.padEnd(7)}] ${level} ${event.msg ?? ''}${extra}`)
}

console.error(`\n${events.length} events for conversation ${conversationId}${runId ? ` run ${runId}` : ''}`)
