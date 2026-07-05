import { apId, isNil, sanitizeObjectForPostgresql, unique } from '@activepieces/core-utils'
import {
    AdhocRun,
    AdhocRunKind,
    AdhocRunSource,
    CodeAction,
    Cursor,
    EngineResponseStatus,
    ExecuteActionResponse,
    FlowActionType,
    FlowRunStatus,
    PieceAction,
    PopulatedAdhocRun,
    SeekPage,
    WorkerJobType,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, In, IsNull, LessThan, Not, SelectQueryBuilder } from 'typeorm'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { UserEntity } from '../user/user-entity'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { AdhocRunEntity } from './adhoc-run.entity'

const adhocRunRepo = repoFactory<AdhocRun>(AdhocRunEntity)
const appConnectionRepo = repoFactory(AppConnectionEntity)
const userRepo = repoFactory(UserEntity)

type EngineActionResponse = {
    status: EngineResponseStatus
    response: ExecuteActionResponse
    error?: string
    logs?: string
}

function deriveStatus(engineResponse: EngineActionResponse): FlowRunStatus {
    switch (engineResponse.status) {
        case EngineResponseStatus.OK:
            return engineResponse.response.success ? FlowRunStatus.SUCCEEDED : FlowRunStatus.FAILED
        case EngineResponseStatus.TIMEOUT:
            return FlowRunStatus.TIMEOUT
        default:
            return FlowRunStatus.INTERNAL_ERROR
    }
}

function deriveErrorMessage(engineResponse: EngineActionResponse, status: FlowRunStatus): string | null {
    if (status === FlowRunStatus.SUCCEEDED) {
        return null
    }
    if (!isNil(engineResponse.response?.message)) {
        return String(engineResponse.response.message)
    }
    if (!isNil(engineResponse.error)) {
        return engineResponse.error
    }
    return null
}

function sanitizeValue(value: unknown): unknown {
    if (isNil(value) || typeof value !== 'object') {
        return value
    }
    return sanitizeObjectForPostgresql(value as Record<string, unknown>)
}

async function buildConnectionDisplayNames(params: { runs: AdhocRun[], projectId: string }): Promise<Map<string, string>> {
    const externalIds = unique(params.runs.map((run) => run.connectionExternalId).filter((id): id is string => !isNil(id)))
    if (externalIds.length === 0) {
        return new Map()
    }
    const connections = await appConnectionRepo().find({
        where: { projectIds: ArrayContains([params.projectId]), externalId: In(externalIds) },
        select: ['externalId', 'displayName'],
    })
    return new Map(connections.map((connection) => [connection.externalId, connection.displayName]))
}

async function buildUsers(runs: AdhocRun[]): Promise<Map<string, AdhocRunUser>> {
    const userIds = unique(runs.map((run) => run.userId).filter((id): id is string => !isNil(id)))
    if (userIds.length === 0) {
        return new Map()
    }
    const users = await userRepo().find({
        where: { id: In(userIds) },
        relations: { identity: true },
    })
    return new Map(users
        .filter((user) => !isNil(user.identity))
        .map((user) => [user.id, {
            name: `${user.identity.firstName} ${user.identity.lastName}`.trim(),
            email: user.identity.email,
            imageUrl: user.identity.imageUrl ?? null,
        }]))
}

function applyAdhocRunFilters(query: SelectQueryBuilder<AdhocRun>, params: AdhocRunFilterParams): SelectQueryBuilder<AdhocRun> {
    let filtered = query
    if (!isNil(params.status) && params.status.length > 0) {
        filtered = filtered.andWhere({ status: In(params.status) })
    }
    if (!isNil(params.source) && params.source.length > 0) {
        filtered = filtered.andWhere({ source: In(params.source) })
    }
    if (!isNil(params.userId) && params.userId.length > 0) {
        filtered = filtered.andWhere({ userId: In(params.userId) })
    }
    if (!isNil(params.createdAfter)) {
        filtered = filtered.andWhere('adhoc_run.created >= :createdAfter', { createdAfter: params.createdAfter })
    }
    if (!isNil(params.createdBefore)) {
        filtered = filtered.andWhere('adhoc_run.created <= :createdBefore', { createdBefore: params.createdBefore })
    }
    return filtered
}

async function populateRuns(params: { runs: AdhocRun[], projectId: string }): Promise<PopulatedAdhocRun[]> {
    const [connectionDisplayNames, users] = await Promise.all([
        buildConnectionDisplayNames(params),
        buildUsers(params.runs),
    ])
    return params.runs.map((run) => {
        const user = isNil(run.userId) ? undefined : users.get(run.userId)
        return {
            ...run,
            connectionDisplayName: isNil(run.connectionExternalId)
                ? null
                : connectionDisplayNames.get(run.connectionExternalId) ?? null,
            userName: user?.name ?? null,
            userEmail: user?.email ?? null,
            userImageUrl: user?.imageUrl ?? null,
        }
    })
}

export const adhocRunService = (log: FastifyBaseLogger) => ({
    async run(params: RunParams): Promise<AdhocRun> {
        const { projectId, platformId, userId, source, step, connectionExternalId, conversationId } = params
        const kind = step.type === FlowActionType.CODE ? AdhocRunKind.CODE : AdhocRunKind.PIECE

        const piece = step.type === FlowActionType.PIECE
            ? await getPiecePackageWithoutArchive(log, platformId, {
                pieceName: step.settings.pieceName,
                pieceVersion: step.settings.pieceVersion,
            })
            : undefined

        const now = dayjs().toISOString()
        const created = await adhocRunRepo().save({
            id: apId(),
            created: now,
            updated: now,
            projectId,
            platformId,
            userId: userId ?? null,
            kind,
            pieceName: step.type === FlowActionType.PIECE ? step.settings.pieceName : null,
            pieceVersion: step.type === FlowActionType.PIECE ? step.settings.pieceVersion : null,
            actionName: step.type === FlowActionType.PIECE ? step.settings.actionName : null,
            connectionExternalId: connectionExternalId ?? null,
            conversationId: conversationId ?? null,
            source,
            status: FlowRunStatus.RUNNING,
            input: sanitizeValue(step.settings.input),
            output: null,
            logs: null,
            errorMessage: null,
            startTime: now,
            finishTime: null,
            logsFileId: null,
            archivedAt: null,
        })

        const engineResponse = await userInteractionWatcher.submitAndWaitForResponse<EngineActionResponse>({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            step,
            piece,
        }, log)

        const status = deriveStatus(engineResponse)
        const output = status === FlowRunStatus.SUCCEEDED ? sanitizeValue(engineResponse.response.output) : null

        const updated = await adhocRunRepo().save({
            ...created,
            status,
            output,
            logs: isNil(engineResponse.logs) ? null : engineResponse.logs,
            errorMessage: deriveErrorMessage(engineResponse, status),
            finishTime: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return updated
    },
    async list(params: ListParams): Promise<SeekPage<PopulatedAdhocRun>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor ?? null)
        const paginator = buildPaginator<AdhocRun>({
            entity: AdhocRunEntity,
            query: {
                limit: params.limit,
                orderBy: [
                    { field: 'created', order: Order.DESC },
                    { field: 'id', order: Order.DESC },
                ],
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        let query = adhocRunRepo().createQueryBuilder('adhoc_run').where({ projectId: params.projectId })
        if (!params.includeArchived) {
            query = query.andWhere({ archivedAt: IsNull() })
        }
        query = applyAdhocRunFilters(query, params)
        const { data, cursor } = await paginator.paginate(query)
        const populated = await populateRuns({ runs: data, projectId: params.projectId })
        return paginationHelper.createPage<PopulatedAdhocRun>(populated, cursor)
    },
    async getOneOrThrow(params: GetOneParams): Promise<PopulatedAdhocRun> {
        const run = await adhocRunRepo().findOneByOrFail({ id: params.id, projectId: params.projectId })
        const [populated] = await populateRuns({ runs: [run], projectId: params.projectId })
        return populated
    },
    async bulkArchive(params: BulkArchiveParams): Promise<void> {
        let query = adhocRunRepo().createQueryBuilder('adhoc_run')
            .select('adhoc_run.id')
            .where({ projectId: params.projectId, archivedAt: IsNull() })
        if (!isNil(params.adhocRunIds) && params.adhocRunIds.length > 0) {
            query = query.andWhere({ id: In(params.adhocRunIds) })
        }
        if (!isNil(params.excludeAdhocRunIds) && params.excludeAdhocRunIds.length > 0) {
            query = query.andWhere({ id: Not(In(params.excludeAdhocRunIds)) })
        }
        query = applyAdhocRunFilters(query, params)
        const runs = await query.getMany()
        if (runs.length === 0) {
            return
        }
        await adhocRunRepo().update({
            id: In(runs.map((run) => run.id)),
            projectId: params.projectId,
        }, {
            archivedAt: dayjs().toISOString(),
        })
    },
    async deleteStale(): Promise<void> {
        const retentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
        const cutoff = dayjs().subtract(retentionDays, 'day').toISOString()
        const maximumRunsToDeletePerIteration = 4000
        const maximumRunsToDeletePerRun = 1_000_000
        let totalAffected = 0
        let affected: number | undefined = undefined
        while ((isNil(affected) || affected === maximumRunsToDeletePerIteration) && totalAffected < maximumRunsToDeletePerRun) {
            const staleRuns = await adhocRunRepo().find({
                select: ['id'],
                where: { created: LessThan(cutoff) },
                take: maximumRunsToDeletePerIteration,
            })
            if (staleRuns.length === 0) {
                break
            }
            const result = await adhocRunRepo().delete({ id: In(staleRuns.map((run) => run.id)) })
            affected = result.affected ?? 0
            totalAffected += affected
            log.info({ count: affected }, '[adhocRunService#deleteStale] iteration completed')
        }
        log.info({ totalAffected }, '[adhocRunService#deleteStale] completed')
    },
})

type AdhocRunUser = {
    name: string
    email: string
    imageUrl: string | null
}

type RunParams = {
    projectId: string
    platformId: string
    userId?: string
    source: AdhocRunSource
    step: PieceAction | CodeAction
    connectionExternalId?: string
    conversationId?: string
}

type AdhocRunFilterParams = {
    status?: FlowRunStatus[]
    source?: AdhocRunSource[]
    userId?: string[]
    createdAfter?: string
    createdBefore?: string
}

type ListParams = AdhocRunFilterParams & {
    projectId: string
    cursor: Cursor | undefined
    limit: number
    includeArchived?: boolean
}

type GetOneParams = {
    projectId: string
    id: string
}

type BulkArchiveParams = AdhocRunFilterParams & {
    projectId: string
    adhocRunIds?: string[]
    excludeAdhocRunIds?: string[]
}
