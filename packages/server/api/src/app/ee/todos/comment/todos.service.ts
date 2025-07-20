import { TodoComment, TodoCommentWithUser } from '@activepieces/ee-shared'
import { ActivepiecesError, ApId, apId, Cursor, ErrorCode, PlatformId, ProjectId, SeekPage, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { Order } from '../../../helper/pagination/paginator'
import { userService } from '../../../user/user-service'
import { TodoCommentEntity } from './todos-comment.entity'

const repo = repoFactory(TodoCommentEntity)  

export const todoCommentService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<TodoComment> {
        if (params.content.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Content is required' },
            })
        }
        return repo().save({
            id: apId(),
            ...params,
        })
    },
    async getOne(params: GetParams): Promise<TodoComment | null> {
        return repo().findOneBy({ id: params.id })
    },
    async getOneOrThrow(params: GetParams): Promise<TodoComment> {
        const todoComment = await this.getOne(params)
        if (!todoComment) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'todo_comment', entityId: params.id, message: 'Todo comment by id not found' },
            })
        }
        return todoComment
    },
    async list(params: ListParams): Promise<SeekPage<TodoCommentWithUser>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<TodoComment>({
            entity: TodoCommentEntity,
            query: {
                limit: params.limit,
                order: Order.ASC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo().createQueryBuilder('todo_comment').where({
            todoId: params.todoId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const enrichedData = await Promise.all(
            data.map(async (comment) => {
                return enrichTodoCommentWithUser(comment, _log)
            }),
        )
        return paginationHelper.createPage<TodoCommentWithUser>(enrichedData, newCursor)
    },
})


async function enrichTodoCommentWithUser(
    comment: TodoComment,
    log: FastifyBaseLogger,
): Promise<TodoCommentWithUser> {
    const user = await userService.getOneOrFail({
        id: comment.userId,
    })
    const identity = await userIdentityService(log).getBasicInformation(user.identityId)
    return {
        ...comment,
        user: {
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
    todoId: ApId
    limit: number
    cursor: Cursor | null
}

type CreateParams = {
    content: string
    platformId: PlatformId
    projectId: ProjectId
    userId: UserId
    todoId: ApId
}