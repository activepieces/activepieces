import { repoFactory } from '../../core/db/repo-factory'
import { SandboxSessionEntity, SandboxSessionEventEntity, SandboxSessionEventRow, SandboxSessionRow } from './sandbox-session-entity'

const sessionRepo = repoFactory(SandboxSessionEntity)
const eventRepo = repoFactory(SandboxSessionEventEntity)

function parseInteger(value: string | number): number {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid integer value returned by postgres: ${String(value)}`)
    }
    return parsed
}

function parseSender(value: string): 'client' | 'agent' {
    if (value === 'agent' || value === 'client') return value
    throw new Error(`Invalid sender value returned by postgres: ${value}`)
}

function toSessionRecord(row: SandboxSessionRow): SessionRecord {
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

function toEventRecord(row: SandboxSessionEventRow): SessionEvent {
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

function fromSessionRecord(session: SessionRecord): SandboxSessionRow {
    return {
        id: session.id,
        agent: session.agent,
        agent_session_id: session.agentSessionId,
        last_connection_id: session.lastConnectionId,
        created_at: session.createdAt,
        destroyed_at: session.destroyedAt ?? null,
        sandbox_id: session.sandboxId ?? null,
        session_init_json: session.sessionInit ?? null,
        config_options_json: session.configOptions ?? null,
        modes_json: session.modes ?? null,
    }
}

function normalizeLimit(limit: number | undefined): number {
    if (limit === undefined || !Number.isFinite(limit) || limit < 1) return 100
    return Math.floor(limit)
}

function parseCursor(cursor: string | undefined): number {
    if (!cursor) return 0
    const parsed = Number.parseInt(cursor, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return parsed
}

export class PostgresSessionPersistDriver {

    async getSession(id: string): Promise<SessionRecord | undefined> {
        const row = await sessionRepo().findOneBy({ id })
        return row ? toSessionRecord(row) : undefined
    }

    async listSessions(request: ListPageRequest = {}): Promise<ListPage<SessionRecord>> {
        const offset = parseCursor(request.cursor)
        const limit = normalizeLimit(request.limit)

        const [rows, total] = await sessionRepo()
            .createQueryBuilder('s')
            .orderBy('s.created_at', 'ASC')
            .addOrderBy('s.id', 'ASC')
            .skip(offset)
            .take(limit)
            .getManyAndCount()

        const nextOffset = offset + rows.length
        return {
            items: rows.map(toSessionRecord),
            nextCursor: nextOffset < total ? String(nextOffset) : undefined,
        }
    }

    async updateSession(session: SessionRecord): Promise<void> {
        await sessionRepo().save(fromSessionRecord(session))
    }

    async listEvents(request: ListEventsRequest): Promise<ListPage<SessionEvent>> {
        const offset = parseCursor(request.cursor)
        const limit = normalizeLimit(request.limit)

        const [rows, total] = await eventRepo()
            .createQueryBuilder('e')
            .where('e.session_id = :sessionId', { sessionId: request.sessionId })
            .orderBy('e.event_index', 'ASC')
            .addOrderBy('e.id', 'ASC')
            .skip(offset)
            .take(limit)
            .getManyAndCount()

        const nextOffset = offset + rows.length
        return {
            items: rows.map(toEventRecord),
            nextCursor: nextOffset < total ? String(nextOffset) : undefined,
        }
    }

    async insertEvent(_sessionId: string, event: SessionEvent): Promise<void> {
        await eventRepo().save({
            id: event.id,
            event_index: event.eventIndex,
            session_id: event.sessionId,
            created_at: event.createdAt,
            connection_id: event.connectionId,
            sender: event.sender,
            payload_json: event.payload,
        })
    }

    async close(): Promise<void> {
    }
}

type SessionRecord = {
    id: string
    agent: string
    agentSessionId: string
    lastConnectionId: string
    createdAt: number
    destroyedAt?: number
    sandboxId?: string
    sessionInit?: Record<string, unknown>
    configOptions?: Record<string, unknown>[]
    modes?: Record<string, unknown>
}

type SessionEvent = {
    id: string
    eventIndex: number
    sessionId: string
    createdAt: number
    connectionId: string
    sender: 'client' | 'agent'
    payload: Record<string, unknown>
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
