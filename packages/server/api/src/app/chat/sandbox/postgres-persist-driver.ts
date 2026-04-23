import { isNil } from '@activepieces/shared'
import { Pool } from 'pg'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

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

type SessionRow = {
    id: string
    agent: string
    agent_session_id: string
    last_connection_id: string
    created_at: string | number
    destroyed_at: string | number | null
    sandbox_id: string | null
    session_init_json: unknown
    config_options_json: unknown
    modes_json: unknown
}

type EventRow = {
    id: string | number
    event_index: string | number
    session_id: string
    created_at: string | number
    connection_id: string
    sender: string
    payload_json: unknown
}

const DEFAULT_LIST_LIMIT = 100
const SCHEMA = 'public'

function buildConnectionString(): string {
    const url = system.get(AppSystemProp.POSTGRES_URL)
    if (!isNil(url)) {
        return url
    }
    const host = system.getOrThrow(AppSystemProp.POSTGRES_HOST)
    const port = system.getOrThrow(AppSystemProp.POSTGRES_PORT)
    const user = system.getOrThrow(AppSystemProp.POSTGRES_USERNAME)
    const password = system.getOrThrow(AppSystemProp.POSTGRES_PASSWORD)
    const database = system.getOrThrow(AppSystemProp.POSTGRES_DATABASE)
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

function table(name: 'sessions' | 'events'): string {
    return `"${SCHEMA}"."sandbox_${name}"`
}

function parseInteger(value: string | number): number {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid integer value returned by postgres: ${String(value)}`)
    }
    return parsed
}

function parseSender(value: string): 'client' | 'agent' {
    if (value === 'agent' || value === 'client') {
        return value
    }
    throw new Error(`Invalid sender value returned by postgres: ${value}`)
}

function decodeSessionRow(row: SessionRow): SessionRecord {
    return {
        id: row.id,
        agent: row.agent,
        agentSessionId: row.agent_session_id,
        lastConnectionId: row.last_connection_id,
        createdAt: parseInteger(row.created_at),
        destroyedAt: row.destroyed_at === null ? undefined : parseInteger(row.destroyed_at),
        sandboxId: row.sandbox_id ?? undefined,
        sessionInit: row.session_init_json ?? undefined,
        configOptions: Array.isArray(row.config_options_json) ? row.config_options_json : undefined,
        modes: row.modes_json ?? undefined,
    }
}

function decodeEventRow(row: EventRow): SessionEvent {
    return {
        id: String(row.id),
        eventIndex: parseInteger(row.event_index),
        sessionId: row.session_id,
        createdAt: parseInteger(row.created_at),
        connectionId: row.connection_id,
        sender: parseSender(row.sender),
        payload: row.payload_json,
    }
}

function normalizeLimit(limit: number | undefined): number {
    if (limit === undefined || !Number.isFinite(limit) || limit < 1) {
        return DEFAULT_LIST_LIMIT
    }
    return Math.floor(limit)
}

function parseCursor(cursor: string | undefined): number {
    if (!cursor) return 0
    const parsed = Number.parseInt(cursor, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return parsed
}

export class PostgresSessionPersistDriver {
    private readonly pool: Pool
    private readonly initialized: Promise<void>

    constructor() {
        this.pool = new Pool({ connectionString: buildConnectionString() })
        this.initialized = this.initialize()
    }

    async getSession(id: string): Promise<SessionRecord | undefined> {
        await this.ready()
        const result = await this.pool.query<SessionRow>(
            `SELECT id, agent, agent_session_id, last_connection_id, created_at, destroyed_at, sandbox_id, session_init_json, config_options_json, modes_json
             FROM ${table('sessions')} WHERE id = $1`,
            [id],
        )
        return result.rows.length === 0 ? undefined : decodeSessionRow(result.rows[0])
    }

    async listSessions(request: ListPageRequest = {}): Promise<ListPage<SessionRecord>> {
        await this.ready()
        const offset = parseCursor(request.cursor)
        const limit = normalizeLimit(request.limit)

        const rowsResult = await this.pool.query<SessionRow>(
            `SELECT id, agent, agent_session_id, last_connection_id, created_at, destroyed_at, sandbox_id, session_init_json, config_options_json, modes_json
             FROM ${table('sessions')} ORDER BY created_at ASC, id ASC LIMIT $1 OFFSET $2`,
            [limit, offset],
        )
        const countResult = await this.pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM ${table('sessions')}`)
        const total = parseInteger(countResult.rows[0]?.count ?? '0')
        const nextOffset = offset + rowsResult.rows.length

        return {
            items: rowsResult.rows.map(decodeSessionRow),
            nextCursor: nextOffset < total ? String(nextOffset) : undefined,
        }
    }

    async updateSession(session: SessionRecord): Promise<void> {
        await this.ready()
        await this.pool.query(
            `INSERT INTO ${table('sessions')} (
                id, agent, agent_session_id, last_connection_id, created_at, destroyed_at, sandbox_id, session_init_json, config_options_json, modes_json
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT(id) DO UPDATE SET
                agent = EXCLUDED.agent,
                agent_session_id = EXCLUDED.agent_session_id,
                last_connection_id = EXCLUDED.last_connection_id,
                created_at = EXCLUDED.created_at,
                destroyed_at = EXCLUDED.destroyed_at,
                sandbox_id = EXCLUDED.sandbox_id,
                session_init_json = EXCLUDED.session_init_json,
                config_options_json = EXCLUDED.config_options_json,
                modes_json = EXCLUDED.modes_json`,
            [
                session.id, session.agent, session.agentSessionId, session.lastConnectionId,
                session.createdAt, session.destroyedAt ?? null, session.sandboxId ?? null,
                session.sessionInit ? JSON.stringify(session.sessionInit) : null,
                session.configOptions ? JSON.stringify(session.configOptions) : null,
                session.modes !== undefined ? JSON.stringify(session.modes) : null,
            ],
        )
    }

    async listEvents(request: ListEventsRequest): Promise<ListPage<SessionEvent>> {
        await this.ready()
        const offset = parseCursor(request.cursor)
        const limit = normalizeLimit(request.limit)

        const rowsResult = await this.pool.query<EventRow>(
            `SELECT id, event_index, session_id, created_at, connection_id, sender, payload_json
             FROM ${table('events')} WHERE session_id = $1 ORDER BY event_index ASC, id ASC LIMIT $2 OFFSET $3`,
            [request.sessionId, limit, offset],
        )
        const countResult = await this.pool.query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM ${table('events')} WHERE session_id = $1`,
            [request.sessionId],
        )
        const total = parseInteger(countResult.rows[0]?.count ?? '0')
        const nextOffset = offset + rowsResult.rows.length

        return {
            items: rowsResult.rows.map(decodeEventRow),
            nextCursor: nextOffset < total ? String(nextOffset) : undefined,
        }
    }

    async insertEvent(_sessionId: string, event: SessionEvent): Promise<void> {
        await this.ready()
        await this.pool.query(
            `INSERT INTO ${table('events')} (
                id, event_index, session_id, created_at, connection_id, sender, payload_json
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT(id) DO UPDATE SET
                event_index = EXCLUDED.event_index,
                session_id = EXCLUDED.session_id,
                created_at = EXCLUDED.created_at,
                connection_id = EXCLUDED.connection_id,
                sender = EXCLUDED.sender,
                payload_json = EXCLUDED.payload_json`,
            [event.id, event.eventIndex, event.sessionId, event.createdAt, event.connectionId, event.sender, event.payload],
        )
    }

    async close(): Promise<void> {
        await this.pool.end()
    }

    private async ready(): Promise<void> {
        await this.initialized
    }

    private async initialize(): Promise<void> {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${table('sessions')} (
                id TEXT PRIMARY KEY,
                agent TEXT NOT NULL,
                agent_session_id TEXT NOT NULL,
                last_connection_id TEXT NOT NULL,
                created_at BIGINT NOT NULL,
                destroyed_at BIGINT,
                sandbox_id TEXT,
                session_init_json JSONB,
                config_options_json JSONB,
                modes_json JSONB
            )
        `)

        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${table('events')} (
                id TEXT PRIMARY KEY,
                event_index BIGINT NOT NULL,
                session_id TEXT NOT NULL,
                created_at BIGINT NOT NULL,
                connection_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                payload_json JSONB NOT NULL
            )
        `)

        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_sandbox_events_session_order
            ON ${table('events')}(session_id, event_index, id)
        `)
    }
}
