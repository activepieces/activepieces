import { sanitizeObjectForPostgresql } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { SandboxSessionEntity, type SandboxSessionRecord } from './sandbox-session-entity'
import { SandboxSessionEventEntity, type SandboxSessionEventRecord } from './sandbox-session-event-entity'

const sessionRepo = repoFactory(SandboxSessionEntity)
const eventRepo = repoFactory(SandboxSessionEventEntity)

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

export class PostgresSessionPersistDriver {
    async getSession(id: string): Promise<SandboxSessionRecord | undefined> {
        const result = await sessionRepo().findOneBy({ id })
        return result ?? undefined
    }

    async listSessions(request?: ListPageRequest): Promise<ListPage<SandboxSessionRecord>> {
        const limit = request?.limit ?? 50
        const qb = sessionRepo()
            .createQueryBuilder('s')
            .orderBy('s.createdAt', 'DESC')
            .take(limit + 1)

        if (request?.cursor) {
            qb.andWhere('s.createdAt < (SELECT ss."createdAt" FROM sandbox_session ss WHERE ss.id = :cursor)', { cursor: request.cursor })
        }

        const results = await qb.getMany()
        const hasMore = results.length > limit
        const items = hasMore ? results.slice(0, limit) : results

        return {
            items,
            nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
        }
    }

    async updateSession(session: SandboxSessionRecord): Promise<void> {
        await sessionRepo().upsert(sanitizeObjectForPostgresql(session), ['id'])
    }

    async listEvents(request: ListEventsRequest): Promise<ListPage<SandboxSessionEventRecord>> {
        const limit = request?.limit ?? 1000
        const qb = eventRepo()
            .createQueryBuilder('e')
            .where('e.sessionId = :sessionId', { sessionId: request.sessionId })
            .orderBy('e.eventIndex', 'ASC')
            .take(limit + 1)

        if (request?.cursor) {
            const cursorIndex = parseInt(request.cursor, 10)
            if (!isNaN(cursorIndex)) {
                qb.andWhere('e.eventIndex > :cursorIndex', { cursorIndex })
            }
        }

        const results = await qb.getMany()
        const hasMore = results.length > limit
        const items = hasMore ? results.slice(0, limit) : results

        return {
            items,
            nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
        }
    }

    async insertEvent(_sessionId: string, event: SandboxSessionEventRecord): Promise<void> {
        await eventRepo().insert(sanitizeObjectForPostgresql(event))
    }
}
