import { apId, isNil, tryCatch, unique } from '@activepieces/core-utils'
import {
    ActionRun,
    ActionRunKind,
    ActionRunListItem,
    ActionRunSource,
    ActivepiecesError,
    CodeAction,
    Cursor,
    ErrorCode,
    FileCompression,
    FileType,
    FlowActionType,
    FlowRunStatus,
    PieceAction,
    PopulatedActionRun,
    SeekPage,
    WorkerJobType,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, In, IsNull, LessThan, Not, SelectQueryBuilder } from 'typeorm'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { repoFactory } from '../core/db/repo-factory'
import { fileCompressor } from '../file/file-compressor'
import { fileService } from '../file/file.service'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { UserEntity } from '../user/user-entity'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { deriveActionRunOutcome, EngineActionResponse } from './action-run-outcome'
import { actionRunPersistQueue } from './action-run-persist-queue'
import { ActionRunEntity } from './action-run.entity'

const actionRunRepo = repoFactory<ActionRun>(ActionRunEntity)
const appConnectionRepo = repoFactory(AppConnectionEntity)
const userRepo = repoFactory(UserEntity)

async function buildConnectionDisplayNames(params: { runs: ActionRun[], projectId: string }): Promise<Map<string, string>> {
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

async function buildUsers(runs: ActionRun[]): Promise<Map<string, ActionRunUser>> {
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

function applyActionRunFilters(query: SelectQueryBuilder<ActionRun>, params: ActionRunFilterParams): SelectQueryBuilder<ActionRun> {
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
        filtered = filtered.andWhere('action_run.created >= :createdAfter', { createdAfter: params.createdAfter })
    }
    if (!isNil(params.createdBefore)) {
        filtered = filtered.andWhere('action_run.created <= :createdBefore', { createdBefore: params.createdBefore })
    }
    return filtered
}

async function populateRuns(params: { runs: ActionRun[], projectId: string }): Promise<PopulatedActionRun[]> {
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

async function hydratePayload(params: { run: ActionRun, log: FastifyBaseLogger }): Promise<ActionRun> {
    const { run, log } = params
    if (isNil(run.logsFileId)) {
        return run
    }
    const file = await fileService(log).getDataOrUndefined({
        projectId: run.projectId,
        fileId: run.logsFileId,
        type: FileType.ACTION_RUN_LOG,
    })
    if (isNil(file)) {
        return run
    }
    const payload: ActionRunPayload = JSON.parse(file.data.toString('utf-8'))
    return {
        ...run,
        input: payload.input ?? null,
        output: payload.output ?? null,
        logs: payload.logs ?? null,
    }
}

async function writePayloadFile(params: { run: ActionRun, platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const { run, platformId, log } = params
    if (isNil(run.logsFileId)) {
        return
    }
    const blob = Buffer.from(JSON.stringify({ input: run.input, output: run.output, logs: run.logs }))
    const compressed = await fileCompressor.compress({ data: blob, compression: FileCompression.ZSTD })
    await fileService(log).save({
        fileId: run.logsFileId,
        projectId: run.projectId,
        platformId,
        type: FileType.ACTION_RUN_LOG,
        data: compressed,
        size: compressed.length,
        compression: FileCompression.ZSTD,
    })
}

export const actionRunService = (log: FastifyBaseLogger) => ({
    async run(params: RunParams): Promise<ActionRun> {
        const { projectId, platformId, userId, source, step, connectionExternalId, conversationId } = params
        const kind = step.type === FlowActionType.CODE ? ActionRunKind.CODE : ActionRunKind.PIECE

        const piece = step.type === FlowActionType.PIECE
            ? await getPiecePackageWithoutArchive(log, platformId, {
                pieceName: step.settings.pieceName,
                pieceVersion: step.settings.pieceVersion,
            })
            : undefined

        const startTime = dayjs().toISOString()
        const result = await tryCatch(() => userInteractionWatcher.submitAndWaitForResponse<EngineActionResponse>({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            step,
            piece,
        }, log))
        const finishTime = dayjs().toISOString()

        const outcome = deriveActionRunOutcome({ result, input: step.settings.input })

        const run: ActionRun = {
            id: apId(),
            created: startTime,
            updated: finishTime,
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
            status: outcome.status,
            input: outcome.input,
            output: outcome.output,
            logs: outcome.logs,
            errorMessage: outcome.errorMessage,
            startTime,
            finishTime,
            logsFileId: outcome.hasPayload ? apId() : null,
            archivedAt: null,
        }

        // Offload {input,output,logs} to the file table before enqueuing so the persist job (hence
        // Redis) carries only the thinned row, never the raw payload. Best-effort: a failed file
        // write must not drop the run record — the row persists, payload hydration degrades to empty.
        const { error: fileError } = await tryCatch(() => writePayloadFile({ run, platformId, log }))
        if (fileError) {
            log.error({ error: fileError, actionRun: { id: run.id } }, '[actionRunService#run] failed to write action run payload file')
        }
        await actionRunPersistQueue(log).add({ run: { ...run, input: null, output: null, logs: null } })

        if (result.error) {
            throw result.error
        }
        return run
    },
    async list(params: ListParams): Promise<SeekPage<ActionRunListItem>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor ?? null)
        const paginator = buildPaginator<ActionRun>({
            entity: ActionRunEntity,
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
        // input/output/logs are `select: false`, so the list never fetches the heavy columns.
        let query = actionRunRepo().createQueryBuilder('action_run').where({ projectId: params.projectId })
        if (!params.includeArchived) {
            query = query.andWhere({ archivedAt: IsNull() })
        }
        query = applyActionRunFilters(query, params)
        const { data, cursor } = await paginator.paginate(query)
        const populated = await populateRuns({ runs: data, projectId: params.projectId })
        return paginationHelper.createPage<ActionRunListItem>(populated, cursor)
    },
    async getOneOrThrow(params: GetOneParams): Promise<PopulatedActionRun> {
        let query = actionRunRepo().createQueryBuilder('action_run')
            .addSelect(['action_run.input', 'action_run.output', 'action_run.logs'])
            .where({ id: params.id, projectId: params.projectId })
        if (!params.includeArchived) {
            query = query.andWhere({ archivedAt: IsNull() })
        }
        const run = await query.getOne()
        if (isNil(run)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'action_run', entityId: params.id, message: 'action run not found' },
            })
        }
        const hydrated = await hydratePayload({ run, log })
        const [populated] = await populateRuns({ runs: [hydrated], projectId: params.projectId })
        return populated
    },
    async bulkArchive(params: BulkArchiveParams): Promise<void> {
        const maximumRunsToArchivePerIteration = 4000
        let affected: number | undefined = undefined
        while (isNil(affected) || affected === maximumRunsToArchivePerIteration) {
            let query = actionRunRepo().createQueryBuilder('action_run')
                .select('action_run.id')
                .where({ projectId: params.projectId, archivedAt: IsNull() })
            if (!isNil(params.actionRunIds) && params.actionRunIds.length > 0) {
                query = query.andWhere({ id: In(params.actionRunIds) })
            }
            if (!isNil(params.excludeActionRunIds) && params.excludeActionRunIds.length > 0) {
                query = query.andWhere({ id: Not(In(params.excludeActionRunIds)) })
            }
            query = applyActionRunFilters(query, params)
            const runs = await query.take(maximumRunsToArchivePerIteration).getMany()
            if (runs.length === 0) {
                break
            }
            const result = await actionRunRepo().update({
                id: In(runs.map((run) => run.id)),
                projectId: params.projectId,
            }, {
                archivedAt: dayjs().toISOString(),
            })
            affected = result.affected ?? runs.length
        }
    },
    async deleteStale(): Promise<void> {
        const retentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
        const cutoff = dayjs().subtract(retentionDays, 'day').toISOString()
        const maximumRunsToDeletePerIteration = 4000
        const maximumRunsToDeletePerRun = 1_000_000
        let totalAffected = 0
        let affected: number | undefined = undefined
        while ((isNil(affected) || affected === maximumRunsToDeletePerIteration) && totalAffected < maximumRunsToDeletePerRun) {
            const staleRuns = await actionRunRepo().find({
                select: ['id'],
                where: { created: LessThan(cutoff) },
                take: maximumRunsToDeletePerIteration,
            })
            if (staleRuns.length === 0) {
                break
            }
            const result = await actionRunRepo().delete({ id: In(staleRuns.map((run) => run.id)) })
            affected = result.affected ?? staleRuns.length
            totalAffected += affected
            log.info({ count: affected }, '[actionRunService#deleteStale] iteration completed')
        }
        log.info({ totalAffected }, '[actionRunService#deleteStale] completed')
    },
})

type ActionRunUser = {
    name: string
    email: string
    imageUrl: string | null
}

type ActionRunPayload = {
    input?: unknown
    output?: unknown
    logs?: string | null
}

type RunParams = {
    projectId: string
    platformId: string
    userId?: string
    source: ActionRunSource
    step: PieceAction | CodeAction
    connectionExternalId?: string
    conversationId?: string
}

type ActionRunFilterParams = {
    status?: FlowRunStatus[]
    source?: ActionRunSource[]
    userId?: string[]
    createdAfter?: string
    createdBefore?: string
}

type ListParams = ActionRunFilterParams & {
    projectId: string
    cursor: Cursor | undefined
    limit: number
    includeArchived?: boolean
}

type GetOneParams = {
    projectId: string
    id: string
    includeArchived?: boolean
}

type BulkArchiveParams = ActionRunFilterParams & {
    projectId: string
    actionRunIds?: string[]
    excludeActionRunIds?: string[]
}
