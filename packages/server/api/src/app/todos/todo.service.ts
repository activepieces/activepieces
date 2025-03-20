import { ActivepiecesError, apId, Cursor, ErrorCode, FlowId, PlatformId, ProjectId, SeekPage, spreadIfDefined, StatusOption, Todo, TodoWithAssignee, UNRESOLVED_STATUS, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Like, Not } from 'typeorm'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { userService } from '../user/user-service'
import { TodoEntity } from './todo.entity'

const repo = repoFactory(TodoEntity)  

export const todoService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<Todo> {
        return repo().save({
            id: apId(),
            status: UNRESOLVED_STATUS,
            ...params,
        })
    },
    async getOne(params: GetParams): Promise<Todo | null> {
        return repo().findOneBy({ id: params.id, platformId: params.platformId, projectId: params.projectId })
    },
    async getOneOrThrow(params: GetParams): Promise<Todo> {
        const todo = await this.getOne(params)
        if (!todo) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'todo', entityId: params.id, message: 'Todo by id not found' },
            })
        }
        return todo
    },
    async getOnePopulatedOrThrow(params: GetParams): Promise<TodoWithAssignee> {
        const todo = await this.getOne(params)
        if (!todo) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'todo', entityId: params.id, message: 'Todo by id not found' },
            })
        }
        const enrichedTask = await enrichTodoWithAssignee(todo, _log)
        return enrichedTask
    },
    async update(params: UpdateParams): Promise<Todo | null> {
        const todo = await this.getOneOrThrow(params)
        if (params.status && todo.approvalUrl) {
            await sendApprovalRequest(todo.approvalUrl, params.status)
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
    async list(params: ListParams): Promise<SeekPage<TodoWithAssignee>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<Todo>({
            entity: TodoEntity,
            query: {
                limit: params.limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        let query = repo().createQueryBuilder('todo').where({
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

        // To avoid fetching tasks for testing purposes
        query = query.andWhere({
            runId: Not(IsNull()),
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const enrichedData = await Promise.all(data.map((task) => enrichTodoWithAssignee(task, _log)))
        return paginationHelper.createPage<TodoWithAssignee>(enrichedData, newCursor)
    },
})

async function sendApprovalRequest(approvalUrl: string, status: StatusOption) {
    const url = new URL(approvalUrl)
    url.searchParams.append('status', status.name)
    await fetch(url.toString(), {
        method: 'POST',
    })
}

async function enrichTodoWithAssignee(
    todo: Todo,
    log: FastifyBaseLogger,
): Promise<TodoWithAssignee> {
    if (!todo.assigneeId) {
        return {
            ...todo,
            assignee: null,
        }
    }
    const user = await userService.getOneOrFail({
        id: todo.assigneeId,
    })
    const identity = await userIdentityService(log).getBasicInformation(user.identityId)
    return {
        ...todo,
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