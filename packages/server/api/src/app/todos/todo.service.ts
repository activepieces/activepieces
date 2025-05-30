import { ActivepiecesError, apId, assertNotNullOrUndefined, Cursor, ErrorCode, FlowId, isNil, PlatformId, ProjectId, SeekPage, spreadIfDefined, StatusOption, Todo, PopulatedTodo, UNRESOLVED_STATUS, UserId, TodoEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { Like } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { userService } from '../user/user-service'
import { todoSideEfffects } from './todo-side-effects'
import { TodoEntity } from './todo.entity'
import { agentsService } from '../agents/agents-service'
import { flowService } from '../flows/flow/flow.service'

const repo = repoFactory(TodoEntity)  

export const todoService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<Todo> {
        return repo().save({
            id: apId(),
            status: UNRESOLVED_STATUS,
            locked: params.locked ?? false,
            ...params,
        })
    },
    async getOne(params: GetParams): Promise<Todo | null> {
        return repo().findOneBy({ id: params.id, ...spreadIfDefined('platformId', params.platformId), ...spreadIfDefined('projectId', params.projectId) })
    },
    async getOnePopulatedOrThrow(params: GetParams): Promise<PopulatedTodo> {
        const todo = await this.getOne(params)
        if (!todo) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'todo', entityId: params.id, message: 'Todo by id not found' },
            })
        }
        const enrichedTask = await enrichTodoWithAssignee(todo, log)
        return enrichedTask
    },
    async update(params: UpdateParams): Promise<PopulatedTodo | null> {
        const todo = await this.getOnePopulatedOrThrow(params)
        if (params.status && todo.resolveUrl && params.status.continueFlow !== false) {
            await sendResolveRequest(todo.resolveUrl, params.status)
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
            ...(params.status && params.status.continueFlow !== false && !params.isTest ? { resolveUrl: null } : {}),
        })
        todoSideEfffects(log).notify({
            socket: params.socket,
            todoId: params.id,
            projectId: params.projectId,
        })
        return this.getOnePopulatedOrThrow(params)
    },
    async resolve(params: ResolveParams) {
        const todo = await this.getOnePopulatedOrThrow({ id: params.id })
        const status = todo.statusOptions.find((option) => option.name === params.status)
        if (isNil(status)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Status not found' },
            })
        }
        if (status.continueFlow === false) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Todo cannot be resolved because the continueFlow is set to false for the status: ${status.name}` },
            })
        }
        if (!isNil(todo.resolveUrl)) {
            await sendResolveRequest(todo.resolveUrl, status)
        }
        await this.update({
            id: params.id,
            platformId: todo.platformId,
            projectId: todo.projectId,
            status,
            isTest: params.isTest,
            socket: params.socket,
        })
        return {
            status: params.status,
        }
    },
    async list(params: ListParams): Promise<SeekPage<PopulatedTodo>> {
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
        if (!isNil(params.assigneeId)) {
            query = query.andWhere({
                assigneeId: params.assigneeId,
            })
        }
        if (!isNil(params.statusOptions)) {
            if (params.statusOptions[0] === UNRESOLVED_STATUS.name) {
                query = query.andWhere('(status->>\'name\' = :statusName OR status->>\'continueFlow\' = :continueFlow)', {
                    statusName: UNRESOLVED_STATUS.name,
                    continueFlow: 'false',
                })
            }
            else {
                query = query.andWhere('status->>\'name\' != :statusName AND (status->>\'continueFlow\' IS NULL OR status->>\'continueFlow\' != :continueFlow)', {
                    statusName: UNRESOLVED_STATUS.name,
                    continueFlow: 'false',
                })
            }
        }
        if (!isNil(params.title)) {
            query = query.andWhere({
                title: Like(`%${params.title}%`),
            })
        }
        if (!isNil(params.environment)) {
            query = query.andWhere({
                environment: params.environment,
            })
        }


        const { data, cursor: newCursor } = await paginator.paginate(query)
        const enrichedData = await Promise.all(data.map((task) => enrichTodoWithAssignee(task, log)))
        return paginationHelper.createPage<PopulatedTodo>(enrichedData, newCursor)
    },
})

async function sendResolveRequest(resolveUrl: string, status: StatusOption) {
    const url = new URL(resolveUrl)
    url.searchParams.append('status', status.name)
    await fetch(url.toString(), {
        method: 'POST',
    })
}

async function enrichTodoWithAssignee(
    todo: Todo,
    log: FastifyBaseLogger,
): Promise<PopulatedTodo> {
    return {
        ...todo,
        assignee: isNil(todo.assigneeId) ? null : await userService.getMetaInformation({
            id: todo.assigneeId,
        }),
        agent: isNil(todo.agentId) ? null : await agentsService(log).getOneOrThrow({
            id: todo.agentId,
        }),
        createdByUser: isNil(todo.createdByUserId) ? null : await userService.getMetaInformation({
            id: todo.createdByUserId,
        }),
        flow: isNil(todo.flowId) ? null : await flowService(log).getOnePopulated({
            id: todo.flowId,
            projectId: todo.projectId,
        }),
    }
}

type ResolveParams = {
    id: string
    status: string
    isTest?: boolean
    socket: Socket
}

type GetParams = {
    id: string
    platformId?: PlatformId
    projectId?: ProjectId
}

type ListParams = {
    platformId: PlatformId
    projectId: ProjectId
    flowId?: FlowId
    assigneeId?: UserId
    limit: number
    environment?: TodoEnvironment
    cursor: Cursor | null
    statusOptions?: string[]
    title?: string
}

type CreateParams = {
    title: string
    description?: string
    statusOptions: StatusOption[]
    platformId: string
    createdByUserId?: string
    projectId: string
    locked?: boolean
    environment: TodoEnvironment
    flowId?: string
    runId?: string
    agentId?: string
    assigneeId?: string
    resolveUrl?: string
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
    isTest?: boolean
    socket: Socket
}