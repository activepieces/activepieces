import { ActivepiecesError, chunk, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import {
    FlowOperationStatus,
    FlowStatus,
    ListWorkerGroupFlowsRequest,
    ListWorkerGroupProjectsRequest,
    WorkerGroupFlowAssignment,
    WorkerGroupFlowAssignmentPage,
    WorkerGroupMoveResult,
    WorkerGroupProjectAssignment,
    WorkerGroupProjectAssignmentPage,
    WorkerGroupScope,
    WorkerGroupsOverview,
    WorkerGroupSummary,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { databaseConnection } from '../../database/database-connection'
import { distributedLock } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { projectRepo } from '../../project/project-repo'
import { QueueName } from '../job'
import { projectConcurrencyDefaults } from '../job-queue/interceptors/rate-limiter-interceptor'
import { jobQueue } from '../job-queue/job-queue'
import { machineService } from '../machine/machine-service'
import { flowWorkerGroupService } from './flow-worker-group.service'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { projectWorkerGroupService } from './project-worker-group.service'
import { platformQueueMigrationService } from './queue-migration.service'
import { workerGroupQueues } from './worker-group-queues'

export const workerGroupAssignmentService = (log: FastifyBaseLogger) => ({
    async overview({ platformId }: { platformId: string }): Promise<WorkerGroupsOverview> {
        const [projectCounts, flowCounts, workers, platformGroupId, projectSamples, flowSamples] = await Promise.all([
            projectRepo()
                .createQueryBuilder('project')
                .select('project."workerGroupId"', 'label')
                .addSelect('COUNT(*)::int', 'count')
                .where('project."platformId" = :platformId', { platformId })
                .andWhere('project.deleted IS NULL')
                .groupBy('project."workerGroupId"')
                .getRawMany<{ label: string | null, count: number }>(),
            platformFlows({ platformId })
                .select('project."workerGroupId"', 'projectGroup')
                .addSelect('flow."workerGroupId"', 'pinned')
                .addSelect('COUNT(*)::int', 'count')
                .groupBy('project."workerGroupId"')
                .addGroupBy('flow."workerGroupId"')
                .getRawMany<{ projectGroup: string | null, pinned: string | null, count: number }>(),
            machineService(log).listOnlineWorkersByGroup(),
            platformWorkerGroupService(log).getWorkerGroupId({ platformId }),
            firstNamesPerGroup(platformProjects({ platformId })
                .select('project."workerGroupId"', 'label')
                .addSelect('project."displayName"', 'name')
                .addSelect('ROW_NUMBER() OVER (PARTITION BY project."workerGroupId")', 'position')),
            firstNamesPerGroup(withLatestVersion(platformFlows({ platformId }))
                .andWhere('flow."workerGroupId" IS NOT NULL')
                .select('flow."workerGroupId"', 'label')
                .addSelect('latest_version."displayName"', 'name')
                .addSelect('ROW_NUMBER() OVER (PARTITION BY flow."workerGroupId")', 'position')),
        ])

        const projectsByLabel = new Map(projectCounts.map((row) => [row.label, row.count]))
        const inheritedFlows = countByLabel(flowCounts.filter((row) => isNil(row.pinned)).map((row) => ({ label: row.projectGroup, count: row.count })))
        const pinnedFlows = countByLabel(flowCounts.filter((row) => !isNil(row.pinned)).map((row) => ({ label: row.pinned, count: row.count })))

        const scopeSources: ScopeSource[] = [
            {
                scope: WorkerGroupScope.PROJECT,
                assignedLabels: [...projectsByLabel.keys()],
                projectCount: (label) => projectsByLabel.get(label) ?? 0,
                flowCount: (label) => inheritedFlows.get(label) ?? 0,
                samples: projectSamples,
            },
            {
                scope: WorkerGroupScope.FLOW,
                assignedLabels: [...pinnedFlows.keys()],
                projectCount: () => 0,
                flowCount: (label) => pinnedFlows.get(label) ?? 0,
                samples: flowSamples,
            },
        ]

        const groups: WorkerGroupSummary[] = (await Promise.all(scopeSources.flatMap((source) => {
            const scopeWorkers = workers.flatMap((w) => w.scope === source.scope && !isNil(w.workerGroupId) && isListedLabel(w.workerGroupId)
                ? [{ slots: w.slots, workerGroupId: w.workerGroupId }]
                : [])
            const onlineLabels = [...new Set(scopeWorkers.map((w) => w.workerGroupId))]
            const labels = [...new Set([...onlineLabels, ...source.assignedLabels])]
                .filter((label): label is string => !isNil(label) && isListedLabel(label))
            return labels.map(async (label): Promise<WorkerGroupSummary> => {
                const machines = scopeWorkers.filter((w) => w.workerGroupId === label)
                return {
                    label,
                    scope: source.scope,
                    online: machines.length,
                    slots: sumSlots(machines),
                    waiting: machines.length === 0 ? await countWaitingJobs({ queueName: workerGroupQueues.getQueueName({ scope: source.scope, workerGroupId: label }), platformId, log }) : 0,
                    projectCount: source.projectCount(label),
                    flowCount: source.flowCount(label),
                    sample: source.samples.get(label) ?? [],
                }
            })
        }))).sort(compareGroups)

        const defaultWorkers = workers.filter((w) => isNil(platformGroupId)
            ? isNil(w.workerGroupId)
            : w.scope === WorkerGroupScope.PLATFORM && w.workerGroupId === platformGroupId)
        return {
            defaultGroup: {
                online: defaultWorkers.length,
                slots: sumSlots(defaultWorkers),
                projectCount: projectsByLabel.get(null) ?? 0,
                flowCount: inheritedFlows.get(null) ?? 0,
                sample: projectSamples.get(null) ?? [],
            },
            groups,
        }
    },

    async listProjects({ platformId, request }: { platformId: string, request: ListWorkerGroupProjectsRequest }): Promise<WorkerGroupProjectAssignmentPage> {
        const query = platformProjects({ platformId })
        if (request.filter === 'shared') {
            query.andWhere('project."workerGroupId" IS NULL')
        }
        else if (!isNil(request.group) && request.filter !== 'all') {
            query.andWhere('project."workerGroupId" = :group', { group: request.group })
        }
        if (!isNil(request.search) && request.search.length > 0) {
            query.andWhere('LOWER(project."displayName") LIKE LOWER(:search)', { search: likePattern(request.search) })
        }
        if (!isNil(request.exclude)) {
            query.andWhere('project."workerGroupId" IS DISTINCT FROM :exclude', { exclude: request.exclude })
        }
        const total = await query.getCount()
        const offset = clampOffset({ offset: request.cursor ?? 0, total, limit: request.limit })
        const rows = await applyOrder(query.select(PROJECT_SELECT), PROJECT_ORDER)
            .offset(offset)
            .limit(request.limit)
            .getRawMany<ProjectRow>()
        return toPage({ data: await withFlowStats({ rows, platformId, log }), offset, limit: request.limit, total })
    },

    async listFlows({ platformId, request }: { platformId: string, request: ListWorkerGroupFlowsRequest }): Promise<WorkerGroupFlowAssignmentPage> {
        const base = platformFlows({ platformId })
        if (!isNil(request.projectId)) {
            base.andWhere('flow."projectId" = :projectId', { projectId: request.projectId })
        }
        if (request.filter === 'pinned') {
            base.andWhere('flow."workerGroupId" IS NOT NULL')
        }
        else if (!isNil(request.group) && request.filter !== 'all') {
            base.andWhere('flow."workerGroupId" = :group', { group: request.group })
        }
        if (!isNil(request.exclude)) {
            base.andWhere('flow."workerGroupId" IS DISTINCT FROM :exclude', { exclude: request.exclude })
        }
        const search = request.search
        const hasSearch = !isNil(search) && search.length > 0
        const query = withLatestVersion(base.clone())
        if (hasSearch) {
            query.andWhere('LOWER(latest_version."displayName") LIKE LOWER(:search)', { search: likePattern(search) })
        }
        const order: SortKey[] = isNil(request.projectId) ? FLOW_ORDER : [['flow."workerGroupId" IS NULL', 'ASC'], ...FLOW_ORDER]
        const total = await (hasSearch ? query : base).getCount()
        const offset = clampOffset({ offset: request.cursor ?? 0, total, limit: request.limit })
        const rows = await applyOrder(query.select(FLOW_SELECT), order)
            .offset(offset)
            .limit(request.limit)
            .getRawMany<FlowRow>()
        return toPage({ data: rows.map(toFlowAssignment), offset, limit: request.limit, total })
    },

    async assignProjects({ platformId, projectIds, workerGroupId }: AssignProjectsParams): Promise<WorkerGroupMoveResult> {
        return withAssignLock({
            platformId,
            log,
            fn: () => applyProjectAssignment({ platformId, projectIds, workerGroupId, log }),
        })
    },

    async assignFlows({ platformId, flowIds, workerGroupId }: AssignFlowsParams): Promise<WorkerGroupMoveResult> {
        return withAssignLock({
            platformId,
            log,
            fn: () => applyFlowAssignment({ platformId, flowIds, workerGroupId, log }),
        })
    },

    async moveAll({ platformId, from, to, scope }: MoveAllParams): Promise<WorkerGroupMoveResult> {
        if (from === to) {
            return { movedWaitingRuns: 0, projects: [], flows: [] }
        }
        return withAssignLock({
            platformId,
            log,
            fn: async () => {
                if (scope === WorkerGroupScope.PROJECT) {
                    const projectIds = (await projectRepo().find({ select: ['id'], where: { platformId, workerGroupId: from, deleted: IsNull() } })).map((p) => p.id)
                    if (projectIds.length === 0) {
                        return { movedWaitingRuns: 0, projects: [], flows: [] }
                    }
                    return applyProjectAssignment({ platformId, projectIds, workerGroupId: to, log })
                }
                const flowIds = (await platformFlows({ platformId })
                    .andWhere('flow."workerGroupId" = :from', { from })
                    .select('flow.id', 'id')
                    .getRawMany<{ id: string }>()).map((f) => f.id)
                if (flowIds.length === 0) {
                    return { movedWaitingRuns: 0, projects: [], flows: [] }
                }
                return applyFlowAssignment({ platformId, flowIds, workerGroupId: to, log })
            },
        })
    },
})

async function withAssignLock<T>({ platformId, log, fn }: { platformId: string, log: FastifyBaseLogger, fn: () => Promise<T> }): Promise<T> {
    return distributedLock(log).runExclusive({
        key: `worker-group-assign:${platformId}`,
        timeoutInSeconds: ASSIGN_LOCK_TIMEOUT_SECONDS,
        fn,
    })
}

async function applyProjectAssignment({ platformId, projectIds, workerGroupId, log }: AssignProjectsParams & { log: FastifyBaseLogger }): Promise<WorkerGroupMoveResult> {
    await assertProjectsAssignable({ workerGroupId, log })
    const uniqueProjectIds = [...new Set(projectIds)]
    const projects = (await Promise.all(chunk(uniqueProjectIds, MAX_IDS_PER_QUERY).map((ids) => projectRepo().find({
        select: ['id', 'workerGroupId'],
        where: { id: In(ids), platformId, deleted: IsNull() },
    })))).flat()
    if (projects.length !== uniqueProjectIds.length) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { message: 'Some projects were not found on this platform' },
        })
    }

    await transaction(async (manager) => {
        for (const ids of chunk(projects.map((p) => p.id), MAX_IDS_PER_QUERY)) {
            await projectRepo(manager).update({ id: In(ids), platformId }, { workerGroupId })
        }
    })
    await projectWorkerGroupService(log).invalidateMany({ projectIds: projects.map((p) => p.id) })

    const movedWaitingRuns = await migrateProjectQueuedJobs({
        platformId,
        projects: projects.map((p) => ({ id: p.id, from: p.workerGroupId ?? null })),
        to: workerGroupId,
        log,
    })
    return {
        movedWaitingRuns,
        projects: projects.map((p) => p.id),
        flows: [],
    }
}

async function applyFlowAssignment({ platformId, flowIds, workerGroupId, log }: AssignFlowsParams & { log: FastifyBaseLogger }): Promise<WorkerGroupMoveResult> {
    await assertFlowsAssignable({ workerGroupId, log })
    const uniqueFlowIds = [...new Set(flowIds)]
    const flows = (await Promise.all(chunk(uniqueFlowIds, MAX_IDS_PER_QUERY).map((ids) => platformFlows({ platformId })
        .andWhere('flow.id IN (:...flowIds)', { flowIds: ids })
        .select('flow.id', 'id')
        .addSelect('flow."projectId"', 'projectId')
        .addSelect('flow."workerGroupId"', 'workerGroupId')
        .getRawMany<{ id: string, projectId: string, workerGroupId: string | null }>()))).flat()
    if (flows.length !== uniqueFlowIds.length) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { message: 'Some flows were not found on this platform' },
        })
    }

    await transaction(async (manager) => {
        for (const ids of chunk(flows.map((f) => f.id), MAX_IDS_PER_QUERY)) {
            await flowRepo(manager).update({ id: In(ids) }, { workerGroupId })
        }
    })
    await flowWorkerGroupService(log).invalidateMany({ flowIds: flows.map((f) => f.id) })

    const movedWaitingRuns = await migrateFlowQueuedJobs({
        platformId,
        flows: flows.map((f) => ({ id: f.id, projectId: f.projectId, from: f.workerGroupId })),
        to: workerGroupId,
        log,
    })
    return {
        movedWaitingRuns,
        projects: [],
        flows: flows.map((f) => f.id),
    }
}

async function assertProjectsAssignable({ workerGroupId, log }: AssertAssignableParams): Promise<void> {
    if (isNil(workerGroupId)) {
        return
    }
    if (!workerGroupQueues.isRoutableWorkerGroupId(workerGroupId)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `"${workerGroupId}" is not a valid worker group id` },
        })
    }
    const scopes = await machineService(log).getWorkerGroupScopes({ workerGroupId })
    if (scopes.length > 0 && !scopes.includes(WorkerGroupScope.PROJECT)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `"${workerGroupId}" does not accept projects` },
        })
    }
}

async function assertFlowsAssignable({ workerGroupId, log }: AssertAssignableParams): Promise<void> {
    if (isNil(workerGroupId)) {
        return
    }
    if (!workerGroupQueues.isRoutableWorkerGroupId(workerGroupId)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `"${workerGroupId}" is not a valid worker group id` },
        })
    }
    const scopes = await machineService(log).getWorkerGroupScopes({ workerGroupId })
    if (scopes.length > 0 && !scopes.includes(WorkerGroupScope.FLOW)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `"${workerGroupId}" does not accept flows` },
        })
    }
}

async function migrateProjectQueuedJobs({ platformId, projects, to, log }: MigrateProjectQueuedJobsParams): Promise<number> {
    const platformGroupId = await platformWorkerGroupService(log).getWorkerGroupId({ platformId })
    const ungroupedQueue = isNil(platformGroupId)
        ? QueueName.WORKER_JOBS
        : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PLATFORM, workerGroupId: platformGroupId })
    const projectQueue = (label: string | null): string => isNil(label) || !workerGroupQueues.isRoutableWorkerGroupId(label)
        ? ungroupedQueue
        : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: label })

    const moves = new Map<string, { from: string, to: string, projectIds: Set<string> }>()
    for (const project of projects) {
        const from = projectQueue(project.from)
        const target = projectQueue(to)
        if (from === target) {
            continue
        }
        const key = `${from}→${target}`
        const move = moves.get(key) ?? { from, to: target, projectIds: new Set<string>() }
        move.projectIds.add(project.id)
        moves.set(key, move)
    }

    const movedJobIds = new Set<string>()
    for (const move of moves.values()) {
        const { data, error } = await tryCatch(() => platformQueueMigrationService(log).migrateAssignmentJobs({
            fromQueueName: move.from,
            toQueueName: move.to,
            projectIds: move.projectIds,
            flowIds: new Set<string>(),
        }))
        if (error) {
            log.error({ platform: { id: platformId }, from: move.from, to: move.to, error }, '[workerGroupAssignmentService#assignProjects] Failed to move waiting jobs to the new worker group queue')
            continue
        }
        data.forEach((jobId) => movedJobIds.add(jobId))
    }
    return movedJobIds.size
}

async function migrateFlowQueuedJobs({ platformId, flows, to, log }: MigrateFlowQueuedJobsParams): Promise<number> {
    const platformGroupId = await platformWorkerGroupService(log).getWorkerGroupId({ platformId })
    const ungroupedQueue = isNil(platformGroupId)
        ? QueueName.WORKER_JOBS
        : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PLATFORM, workerGroupId: platformGroupId })

    const flowProjectIds = [...new Set(flows.map((f) => f.projectId))]
    const flowProjects = (await Promise.all(chunk(flowProjectIds, MAX_IDS_PER_QUERY).map((ids) => projectRepo().find({
        select: ['id', 'workerGroupId'],
        where: { id: In(ids), platformId },
    })))).flat()
    const projectGroupById = new Map(flowProjects.map((p) => [p.id, p.workerGroupId ?? null]))
    const flowQueue = (label: string | null, projectId: string): string => {
        if (!isNil(label)) {
            return workerGroupQueues.getQueueName({ scope: WorkerGroupScope.FLOW, workerGroupId: label })
        }
        const projectGroup = projectGroupById.get(projectId) ?? null
        return isNil(projectGroup) || !workerGroupQueues.isRoutableWorkerGroupId(projectGroup)
            ? ungroupedQueue
            : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: projectGroup })
    }

    const moves = new Map<string, { from: string, to: string, flowIds: Set<string> }>()
    for (const flow of flows) {
        const from = flowQueue(flow.from, flow.projectId)
        const target = flowQueue(to, flow.projectId)
        if (from === target) {
            continue
        }
        const key = `${from}→${target}`
        const move = moves.get(key) ?? { from, to: target, flowIds: new Set<string>() }
        move.flowIds.add(flow.id)
        moves.set(key, move)
    }

    const movedJobIds = new Set<string>()
    for (const move of moves.values()) {
        const { data, error } = await tryCatch(() => platformQueueMigrationService(log).migrateAssignmentJobs({
            fromQueueName: move.from,
            toQueueName: move.to,
            projectIds: new Set<string>(),
            flowIds: move.flowIds,
        }))
        if (error) {
            log.error({ platform: { id: platformId }, from: move.from, to: move.to, error }, '[workerGroupAssignmentService#assignFlows] Failed to move waiting jobs to the new worker group queue')
            continue
        }
        data.forEach((jobId) => movedJobIds.add(jobId))
    }
    return movedJobIds.size
}

async function countWaitingJobs({ queueName, platformId, log }: { queueName: string, platformId: string, log: FastifyBaseLogger }): Promise<number> {
    const queue = await jobQueue(log).getOrCreateQueue({ queueName })
    const byState = await queue.getJobCounts(...WAITING_STATES)
    if (Object.values(byState).every((value) => value === 0)) {
        return 0
    }
    let count = 0
    for (const state of WAITING_STATES) {
        let offset = 0
        while (true) {
            const jobs = await queue.getJobs([state], offset, offset + WAITING_SCAN_BATCH_SIZE - 1)
            count += jobs.filter((job) => job.data?.platformId === platformId).length
            if (jobs.length < WAITING_SCAN_BATCH_SIZE) {
                break
            }
            offset += WAITING_SCAN_BATCH_SIZE
        }
    }
    return count
}

function countByLabel(rows: { label: string | null, count: number }[]): Map<string | null, number> {
    return rows.reduce((byLabel, row) => byLabel.set(row.label, (byLabel.get(row.label) ?? 0) + row.count), new Map<string | null, number>())
}

function compareGroups(a: WorkerGroupSummary, b: WorkerGroupSummary): number {
    if (a.label !== b.label) {
        return a.label < b.label ? -1 : 1
    }
    return a.scope.localeCompare(b.scope)
}

function isListedLabel(label: string): boolean {
    return workerGroupQueues.isRoutableWorkerGroupId(label)
}

function clampOffset({ offset, total, limit }: { offset: number, total: number, limit: number }): number {
    return Math.min(offset, Math.floor(Math.max(total - 1, 0) / limit) * limit)
}

function platformProjects({ platformId }: { platformId: string }) {
    return projectRepo()
        .createQueryBuilder('project')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('project.deleted IS NULL')
}

function platformFlows({ platformId }: { platformId: string }) {
    return flowRepo()
        .createQueryBuilder('flow')
        .innerJoin('project', 'project', 'project.id = flow."projectId"')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('project.deleted IS NULL')
        .andWhere('flow."operationStatus" != :deleting', { deleting: FlowOperationStatus.DELETING })
}

function applyOrder<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, order: SortKey[]): SelectQueryBuilder<T> {
    const [[firstExpression, firstDirection], ...rest] = order
    return rest.reduce(
        (sorted, [expression, direction]) => sorted.addOrderBy(expression, direction),
        query.orderBy(firstExpression, firstDirection),
    )
}

function withLatestVersion<T extends ObjectLiteral>(query: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    const latestVersion = flowVersionRepo()
        .createQueryBuilder('fv_sub')
        .select('fv_sub.id')
        .where('fv_sub."flowId" = flow.id')
        .orderBy('fv_sub.created', 'DESC')
        .limit(1)
    return query.leftJoin(
        'flow_version',
        'latest_version',
        `latest_version."flowId" = flow.id AND latest_version.id = (${latestVersion.getQuery()})`,
    )
}

async function firstNamesPerGroup<T extends ObjectLiteral>(ranked: SelectQueryBuilder<T>): Promise<Map<string | null, string[]>> {
    const rows = await databaseConnection()
        .createQueryBuilder()
        .select('ranked.label', 'label')
        .addSelect('ranked.name', 'name')
        .from(`(${ranked.getQuery()})`, 'ranked')
        .where('ranked.position <= :max', { max: GROUP_SAMPLE_SIZE })
        .setParameters(ranked.getParameters())
        .orderBy('ranked.position', 'ASC')
        .getRawMany<{ label: string | null, name: string | null }>()
    return rows.reduce((byLabel, row) => byLabel.set(row.label, [...(byLabel.get(row.label) ?? []), row.name ?? '']), new Map<string | null, string[]>())
}

function sumSlots(workers: { slots: number }[]): number {
    return workers.reduce((sum, worker) => sum + worker.slots, 0)
}

async function withFlowStats({ rows, platformId, log }: { rows: ProjectRow[], platformId: string, log: FastifyBaseLogger }): Promise<WorkerGroupProjectAssignment[]> {
    if (rows.length === 0) {
        return []
    }
    const defaultLimit = await projectConcurrencyDefaults.resolver({ platformId, log })
    const stats = await flowRepo()
        .createQueryBuilder('flow')
        .select('flow."projectId"', 'projectId')
        .addSelect('flow."workerGroupId"', 'workerGroupId')
        .addSelect('COUNT(*)::int', 'count')
        .where('flow."projectId" IN (:...projectIds)', { projectIds: rows.map((r) => r.id) })
        .andWhere('flow."operationStatus" != :deleting', { deleting: FlowOperationStatus.DELETING })
        .groupBy('flow."projectId"')
        .addGroupBy('flow."workerGroupId"')
        .getRawMany<{ projectId: string, workerGroupId: string | null, count: number }>()
    return rows.map((row) => {
        const own = stats.filter((s) => s.projectId === row.id)
        const pinned = own.filter((s): s is { projectId: string, workerGroupId: string, count: number } => !isNil(s.workerGroupId))
        return {
            id: row.id,
            displayName: row.displayName,
            color: row.icon?.color ?? '',
            workerGroupId: row.workerGroupId,
            maxConcurrentJobs: row.maxConcurrentJobs,
            defaultMaxConcurrentJobs: defaultLimit(row.workerGroupId),
            flowCount: own.reduce((sum, s) => sum + s.count, 0),
            flowsElsewhere: pinned.reduce((sum, s) => sum + s.count, 0),
            pinnedFlows: pinned.map((s) => ({ workerGroupId: s.workerGroupId, count: s.count })),
        }
    })
}

function toFlowAssignment(row: FlowRow): WorkerGroupFlowAssignment {
    return {
        id: row.id,
        displayName: row.displayName ?? row.id,
        projectId: row.projectId,
        projectName: row.projectName,
        projectColor: row.projectIcon?.color ?? '',
        enabled: row.status === FlowStatus.ENABLED,
        workerGroupId: row.workerGroupId,
        inherited: row.projectWorkerGroupId,
        effective: row.workerGroupId ?? row.projectWorkerGroupId,
    }
}

function toPage<T>({ data, offset, limit, total }: { data: T[], offset: number, limit: number, total: number }): { data: T[], next: string | null, previous: string | null, offset: number, total: number } {
    return {
        data,
        next: offset + limit < total ? String(offset + limit) : null,
        previous: offset > 0 ? String(Math.max(0, offset - limit)) : null,
        offset,
        total,
    }
}

function likePattern(value: string): string {
    return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
}

const PROJECT_ORDER: SortKey[] = [['project.id', 'ASC']]
const FLOW_ORDER: SortKey[] = [['flow.id', 'ASC']]
const PROJECT_SELECT = ['project.id AS id', 'project."displayName" AS "displayName"', 'project.icon AS icon', 'project."workerGroupId" AS "workerGroupId"', 'project."maxConcurrentJobs" AS "maxConcurrentJobs"']
const FLOW_SELECT = [
    'flow.id AS id',
    'flow."projectId" AS "projectId"',
    'flow.status AS status',
    'flow."workerGroupId" AS "workerGroupId"',
    'latest_version."displayName" AS "displayName"',
    'project."displayName" AS "projectName"',
    'project.icon AS "projectIcon"',
    'project."workerGroupId" AS "projectWorkerGroupId"',
]
const GROUP_SAMPLE_SIZE = 4
const MAX_IDS_PER_QUERY = 1000
const ASSIGN_LOCK_TIMEOUT_SECONDS = 120
const WAITING_SCAN_BATCH_SIZE = 500
const WAITING_STATES = ['waiting', 'prioritized', 'delayed', 'paused'] as const

type ProjectRow = {
    id: string
    displayName: string
    icon: { color?: string } | null
    workerGroupId: string | null
    maxConcurrentJobs: number | null
}

type FlowRow = {
    id: string
    projectId: string
    status: FlowStatus
    workerGroupId: string | null
    displayName: string | null
    projectName: string
    projectIcon: { color?: string } | null
    projectWorkerGroupId: string | null
}

type AssignProjectsParams = {
    platformId: string
    projectIds: string[]
    workerGroupId: string | null
}

type AssignFlowsParams = {
    platformId: string
    flowIds: string[]
    workerGroupId: string | null
}

type MoveAllParams = {
    platformId: string
    from: string
    to: string | null
    scope: WorkerGroupScope.PROJECT | WorkerGroupScope.FLOW
}

type ScopeSource = {
    scope: WorkerGroupScope.PROJECT | WorkerGroupScope.FLOW
    assignedLabels: (string | null)[]
    projectCount: (label: string) => number
    flowCount: (label: string) => number
    samples: Map<string | null, string[]>
}

type AssertAssignableParams = {
    workerGroupId: string | null
    log: FastifyBaseLogger
}

type MigrateProjectQueuedJobsParams = {
    platformId: string
    projects: { id: string, from: string | null }[]
    to: string | null
    log: FastifyBaseLogger
}

type MigrateFlowQueuedJobsParams = {
    platformId: string
    flows: { id: string, projectId: string, from: string | null }[]
    to: string | null
    log: FastifyBaseLogger
}

type SortKey = [string, 'ASC' | 'DESC']

