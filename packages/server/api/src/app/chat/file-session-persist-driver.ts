import fs from 'fs/promises'
import path from 'path'

/**
 * Types mirror the sandbox-agent SessionPersistDriver interface.
 * We use our own type declarations to avoid importing ESM-only package at top level.
 */
type SessionRecord = {
    id: string
    agent: string
    agentSessionId: string
    lastConnectionId: string
    createdAt: number
    destroyedAt?: number
    sandboxId?: string
    sessionInit?: unknown
    configOptions?: unknown[]
    modes?: unknown
}

type SessionEvent = {
    id: string
    eventIndex: number
    sessionId: string
    createdAt: number
    connectionId: string
    sender: 'client' | 'agent'
    payload: unknown
}

type ListPageRequest = {
    cursor?: string
    limit?: number
}

type ListPage<T> = {
    items: T[]
    nextCursor?: string
}

type ListEventsRequest = ListPageRequest & {
    sessionId: string
}

const DATA_DIR = path.resolve(process.cwd(), '.sandbox-agent', 'persist')
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions')
const EVENTS_DIR = path.join(DATA_DIR, 'events')

async function ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
}

function sessionPath(id: string): string {
    return path.join(SESSIONS_DIR, `${id}.json`)
}

function eventsDir(sessionId: string): string {
    return path.join(EVENTS_DIR, sessionId)
}

function eventPath(sessionId: string, eventIndex: number): string {
    return path.join(eventsDir(sessionId), `${String(eventIndex).padStart(8, '0')}.json`)
}

/**
 * File-based session persist driver that survives server restarts.
 * Sessions and events are stored as individual JSON files.
 */
export class FileSessionPersistDriver {
    async getSession(id: string): Promise<SessionRecord | undefined> {
        try {
            const data = await fs.readFile(sessionPath(id), 'utf-8')
            return JSON.parse(data) as SessionRecord
        }
        catch {
            return undefined
        }
    }

    async listSessions(request?: ListPageRequest): Promise<ListPage<SessionRecord>> {
        await ensureDir(SESSIONS_DIR)
        const limit = request?.limit ?? 50
        const files = await fs.readdir(SESSIONS_DIR)
        const jsonFiles = files.filter((f) => f.endsWith('.json')).sort().reverse()

        let startIndex = 0
        if (request?.cursor) {
            const cursorFile = `${request.cursor}.json`
            const idx = jsonFiles.indexOf(cursorFile)
            if (idx >= 0) startIndex = idx + 1
        }

        const slice = jsonFiles.slice(startIndex, startIndex + limit + 1)
        const items: SessionRecord[] = []
        for (const file of slice.slice(0, limit)) {
            try {
                const data = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf-8')
                items.push(JSON.parse(data) as SessionRecord)
            }
            catch {
                // skip corrupted files
            }
        }

        return {
            items,
            nextCursor: slice.length > limit ? items[items.length - 1]?.id : undefined,
        }
    }

    async updateSession(session: SessionRecord): Promise<void> {
        await ensureDir(SESSIONS_DIR)
        await fs.writeFile(sessionPath(session.id), JSON.stringify(session), 'utf-8')
    }

    async listEvents(request: ListEventsRequest): Promise<ListPage<SessionEvent>> {
        const dir = eventsDir(request.sessionId)
        await ensureDir(dir)
        const limit = request?.limit ?? 1000
        const files = await fs.readdir(dir)
        const jsonFiles = files.filter((f) => f.endsWith('.json')).sort()

        let startIndex = 0
        if (request?.cursor) {
            const idx = jsonFiles.findIndex((f) => f > `${request.cursor}.json`)
            if (idx >= 0) startIndex = idx
        }

        const slice = jsonFiles.slice(startIndex, startIndex + limit + 1)
        const items: SessionEvent[] = []
        for (const file of slice.slice(0, limit)) {
            try {
                const data = await fs.readFile(path.join(dir, file), 'utf-8')
                items.push(JSON.parse(data) as SessionEvent)
            }
            catch {
                // skip corrupted files
            }
        }

        return {
            items,
            nextCursor: slice.length > limit ? items[items.length - 1]?.id : undefined,
        }
    }

    async insertEvent(sessionId: string, event: SessionEvent): Promise<void> {
        const dir = eventsDir(sessionId)
        await ensureDir(dir)
        await fs.writeFile(eventPath(sessionId, event.eventIndex), JSON.stringify(event), 'utf-8')
    }
}
