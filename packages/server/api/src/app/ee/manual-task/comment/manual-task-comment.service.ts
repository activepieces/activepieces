import { ManualTaskComment, ManualTaskCommentWithUser } from '@activepieces/ee-shared'
import { ActivepiecesError, ApId, apId, Cursor, ErrorCode, PlatformId, ProjectId, SeekPage, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { Order } from '../../../helper/pagination/paginator'
import { userService } from '../../../user/user-service'
import { ManualTaskCommentEntity } from './manual-task-comment.entity'

const repo = repoFactory(ManualTaskCommentEntity)  

export const manualTaskCommentService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<ManualTaskComment> {
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
    async getOne(params: GetParams): Promise<ManualTaskComment | null> {
        return repo().findOneBy({ id: params.id })
    },
    async getOneOrThrow(params: GetParams): Promise<ManualTaskComment> {
        const manualTaskComment = await this.getOne(params)
        if (!manualTaskComment) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'manual_task_comment', entityId: params.id, message: 'Manual task comment by id not found' },
            })
        }
        return manualTaskComment
    },
    async list(params: ListParams): Promise<SeekPage<ManualTaskCommentWithUser>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<ManualTaskComment>({
            entity: ManualTaskCommentEntity,
            query: {
                limit: params.limit,
                order: Order.ASC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo().createQueryBuilder('manual_task_comment').where({
            taskId: params.taskId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const enrichedData = await Promise.all(
            data.map(async (comment) => {
                return enrichManualTaskCommentWithUser(comment, _log)
            }),
        )
        return paginationHelper.createPage<ManualTaskCommentWithUser>(enrichedData, newCursor)
    },
})


async function enrichManualTaskCommentWithUser(
    comment: ManualTaskComment,
    log: FastifyBaseLogger,
): Promise<ManualTaskCommentWithUser> {
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
    taskId: ApId
    limit: number
    cursor: Cursor | null
}

type CreateParams = {
    content: string
    platformId: PlatformId
    projectId: ProjectId
    userId: UserId
    taskId: ApId
}