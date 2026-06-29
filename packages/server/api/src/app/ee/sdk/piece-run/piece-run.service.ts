import { ActivepiecesError, apId, Cursor, ErrorCode, isNil, PlatformId, ProjectId, SeekPage } from '@activepieces/core-utils'
import { PieceRun, PieceRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { Order } from '../../../helper/pagination/paginator'
import { PieceRunEntity } from './piece-run.entity'

const DEFAULT_LIMIT = 20

const pieceRunRepo = repoFactory<PieceRun>(PieceRunEntity)

export const pieceRunService = (_log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<PieceRun> {
        return pieceRunRepo().save({
            id: apId(),
            ...params,
        })
    },
    async list(params: ListParams): Promise<SeekPage<PieceRun>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<PieceRun>({
            entity: PieceRunEntity,
            query: {
                limit: params.limit ?? DEFAULT_LIMIT,
                orderBy: [
                    { field: 'created', order: Order.DESC },
                    { field: 'id', order: Order.DESC },
                ],
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        let query = pieceRunRepo().createQueryBuilder('piece_run').where({
            projectId: params.projectId,
        })
        if (!isNil(params.pieceName)) {
            query = query.andWhere({ pieceName: params.pieceName })
        }
        if (!isNil(params.status) && params.status.length > 0) {
            query = query.andWhere({ status: In(params.status) })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<PieceRun>(data, newCursor)
    },
    async getOneOrThrow(params: GetOneParams): Promise<PieceRun> {
        const pieceRun = await pieceRunRepo().findOneBy({
            id: params.id,
            projectId: params.projectId,
        })
        if (isNil(pieceRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'piece_run',
                    entityId: params.id,
                },
            })
        }
        return pieceRun
    },
})

type CreateParams = {
    projectId: ProjectId
    platformId: PlatformId
    pieceName: string
    pieceVersion: string
    actionName: string
    connectionExternalId: string | null
    input: Record<string, unknown>
    output: unknown
    status: PieceRunStatus
    errorMessage: string | null
    startTime: string
    finishTime: string | null
}

type ListParams = {
    projectId: ProjectId
    cursor: Cursor
    limit?: number
    pieceName?: string
    status?: PieceRunStatus[]
}

type GetOneParams = {
    id: string
    projectId: ProjectId
}
