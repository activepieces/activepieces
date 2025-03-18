import { ActivepiecesError, apId, Cursor, ErrorCode, FlowId, isNil, ManualTask, ManualTaskWithAssignee, PlatformId, ProjectId, SeekPage, spreadIfDefined, StatusOption, UNRESOLVED_STATUS, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Like } from 'typeorm'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { userService } from '../user/user-service'
import { ManualTaskEntity } from './manual-task.entity'

const repo = repoFactory(ManualTaskEntity)  

export const manualTaskService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<ManualTask> {
        return repo().save({
            id: apId(),
            status: UNRESOLVED_STATUS,
            ...params,
        })
    },
    async getOne(params: GetParams): Promise<ManualTask | null> {
        return await repo().findOneBy({ id: params.id, platformId: params.platformId, projectId: params.projectId })
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
    async getOnePopulatedOrThrow(params: GetParams): Promise<ManualTaskWithAssignee> {
        const manualTask = await this.getOne(params)
        if (!manualTask) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'manual_task', entityId: params.id, message: 'Manual task by id not found' },
            })
        }
        const enrichedTask = await enrichManualTaskWithAssignee(manualTask, _log)
        return enrichedTask
    },
    async update(params: UpdateParams): Promise<ManualTask | null> {
        const manualTask = await this.getOneOrThrow(params)
        if (params.status && manualTask.approvalUrl) {
            await sendApprovalRequest(manualTask.approvalUrl, params.status)
        }
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
            ...(params.status ? { approvalUrl: null } : {}),
        })
        return this.getOneOrThrow(params)
    },
    async list(params: ListParams): Promise<SeekPage<ManualTaskWithAssignee>> {
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
            ...spreadIfDefined('flowId', params.flowId),
        })
        if (params.assigneeId) {
            query = query.andWhere({
                assigneeId: params.assigneeId,
            })
        }
        if (params.statusOptions) {
            if (params.statusOptions[0] === UNRESOLVED_STATUS.name) {
                query = query.andWhere('status->>\'name\' = :statusName', {
                    statusName: UNRESOLVED_STATUS.name,
                })
            }
            else {
                query = query.andWhere('status->>\'name\' != :statusName', {
                    statusName: UNRESOLVED_STATUS.name,
                })
            }
        }
        if (params.title) {
            query = query.andWhere({
                title: Like(`%${params.title}%`),
            })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const enrichedData = await Promise.all(data.map((task) => enrichManualTaskWithAssignee(task, _log)))
        return paginationHelper.createPage<ManualTaskWithAssignee>(enrichedData, newCursor)
    },
})

async function sendApprovalRequest(approvalUrl: string, status: StatusOption) {
    const url = new URL(approvalUrl)
    url.searchParams.append('status', status.name)
    await fetch(url.toString(), {
        method: 'POST',
    })
}

async function enrichManualTaskWithAssignee(
    manualTask: ManualTask,
    log: FastifyBaseLogger,
): Promise<ManualTaskWithAssignee> {
    if (!manualTask.assigneeId) {
        return {
            ...manualTask,
            assignee: null,
        }
    }
    const user = await userService.getOneOrFail({
        id: manualTask.assigneeId,
    })
    const identity = await userIdentityService(log).getBasicInformation(user.identityId)
    return {
        ...manualTask,
        assignee: {
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            email: identity.email,
            id: user.id,
            firstName: identity.firstName,
            lastName: identity.lastName,
            created: user.created,
            updated: user.updated,
        },
    }
}

type GetParams = {
    id: string
    platformId: PlatformId
    projectId: ProjectId
}

type ListParams = {
    platformId: PlatformId
    projectId: ProjectId
    flowId?: FlowId
    assigneeId?: UserId
    limit: number
    cursor: Cursor | null
    statusOptions?: string[]
    title?: string
}

type CreateParams = {
    title: string
    description?: string
    statusOptions: StatusOption[]
    platformId: string
    projectId: string
    flowId: string
    runId?: string
    assigneeId?: string
    approvalUrl?: string
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