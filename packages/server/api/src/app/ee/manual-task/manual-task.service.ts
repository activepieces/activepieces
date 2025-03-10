import { ManualTask, StatusOption } from '@activepieces/ee-shared'
import { ActivepiecesError, Cursor, ErrorCode, FlowId, FlowRunId, PlatformId, ProjectId, SeekPage, spreadIfDefined, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { ManualTaskEntity } from './manual-task.entity'

const repo = repoFactory(ManualTaskEntity)  

export const manualTaskService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<ManualTask> {
        return repo().create(params)
    },
    async getOne(params: GetParams): Promise<ManualTask | null> {
        return repo().findOneBy({ id: params.id, platformId: params.platformId, projectId: params.projectId })
    },
    async getOneOrThrow(params: GetParams): Promise<ManualTask> {
        const manualTask = await this.getOne(params)
        if (!manualTask) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'manual_task', entityId: params.id, message: 'Manual task by id not found' },
            })
        }
        return manualTask
    },
    async update(params: UpdateParams): Promise<ManualTask> {
        await this.getOneOrThrow(params)
        await repo().update({
            id: params.id,
            platformId: params.platformId,
            projectId: params.projectId,
        }, {
            ...spreadIfDefined('title', params.title),
            ...spreadIfDefined('description', params.description),
            ...spreadIfDefined('status', params.status),
            ...spreadIfDefined('statusOptions', params.statusOptions),
            ...spreadIfDefined('assigneeId', params.assigneeId),
        })
        return this.getOneOrThrow(params)
    },
    async list(params: ListParams): Promise<SeekPage<ManualTask>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<ManualTask>({
            entity: ManualTaskEntity,
            query: {
                limit: params.limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        let query = repo().createQueryBuilder('manual_task').where({
            platformId: params.platformId,
            projectId: params.projectId,
            flowId: params.flowId,
            runId: params.runId,
        })
        if (params.assigneeId) {
            query = query.andWhere({
                assigneeId: params.assigneeId,
            })
        }
        if (params.statusOptions) {
            query = query.andWhere({
                status: In(params.statusOptions.map((option) => option.name)),
            })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<ManualTask>(data, newCursor)
    },
})

type GetParams = {
    id: string
    platformId: PlatformId
    projectId: ProjectId
}

type ListParams = {
    platformId: PlatformId
    projectId?: ProjectId
    flowId?: FlowId
    runId?: FlowRunId
    assigneeId?: UserId
    limit: number
    cursor: Cursor | null
    statusOptions?: StatusOption[]
}

type CreateParams = {
    title: string
    description?: string
    status: StatusOption
    statusOptions: StatusOption[]
    platformId: string
    projectId: string
    flowId: string
    runId: string
    assigneeId?: string
}

type UpdateParams = {
    id: string
    platformId: string
    projectId: string
    title?: string
    description?: string
    status?: StatusOption
    statusOptions?: StatusOption[]
    assigneeId?: string
}