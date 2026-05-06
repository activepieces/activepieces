import {
    ActivepiecesError,
    apId,
    CreateFolderRequest,
    Cursor,
    ErrorCode,
    Folder,
    FolderDto,
    FolderId,
    isNil, ProjectId,
    SeekPage,
    UpdateFolderRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { flowService } from '../flow/flow.service'
import { FolderEntity } from './folder.entity'

export const folderRepo = repoFactory(FolderEntity)

export const flowFolderService = (log: FastifyBaseLogger) => ({
    async delete(params: DeleteParams): Promise<void> {
        const { projectId, folderId } = params
        const folder = await this.getOneOrThrow({ projectId, folderId })
        await folderRepo().delete({
            id: folder.id,
            projectId,
        })
    },
    async update(params: UpdateParams): Promise<FolderDto> {
        const { projectId, folderId, request } = params
        const folder = await this.getOneOrThrow({ projectId, folderId })
        const folderWithDisplayName = await this.getOneByDisplayNameCaseInsensitive({
            projectId,
            displayName: request.displayName,
        })
        if (folderWithDisplayName && folderWithDisplayName.id !== folderId) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Folder displayName is used' },
            })
        }
        await folderRepo().update(folder.id, {
            displayName: request.displayName,
        })
        return this.getOneOrThrow({ projectId, folderId })
    },
    async upsert(params: UpsertParams): Promise<FolderDto> {
        const { projectId, request } = params
        const folderWithDisplayName = await this.getOneByDisplayNameCaseInsensitive({
            projectId,
            displayName: request.displayName,
        })
        if (!isNil(folderWithDisplayName)) {
            return this.update({
                projectId,
                folderId: folderWithDisplayName.id,
                request,
            })
        }
        const folderId = apId()
        await folderRepo().upsert({
            id: folderId,
            projectId,
            displayName: request.displayName,
            externalId: folderId,
        }, ['projectId', 'displayName'])
        const folder = await folderRepo().findOneByOrFail({ projectId, id: folderId })
        return {
            ...folder,
            numberOfFlows: 0,
        }
    },
    async listAllByProject(params: ListAllParams): Promise<Folder[]> {
        const { projectId } = params
        return folderRepo().find({ where: { projectId } })
    },
    async upsertByExternalId(params: UpsertByExternalIdParams): Promise<Folder> {
        const { projectId, externalId, displayName, displayOrder } = params
        const existing = await folderRepo().findOneBy({ projectId, externalId })
        if (!isNil(existing)) {
            await folderRepo().update(existing.id, {
                displayName,
                displayOrder,
            })
            return folderRepo().findOneByOrFail({ id: existing.id, projectId })
        }
        const folderId = apId()
        await folderRepo().insert({
            id: folderId,
            projectId,
            displayName,
            displayOrder,
            externalId,
        })
        return folderRepo().findOneByOrFail({ id: folderId, projectId })
    },
    async deleteByExternalId(params: DeleteByExternalIdParams): Promise<void> {
        const { projectId, externalId } = params
        const existing = await folderRepo().findOneBy({ projectId, externalId })
        if (isNil(existing)) {
            return
        }
        await folderRepo().delete({ id: existing.id, projectId })
    },
    async list(params: ListParams): Promise<SeekPage<FolderDto>> {
        const { projectId, cursorRequest, limit } = params
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: FolderEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        
        const queryBuilder = folderRepo()
            .createQueryBuilder('folder')
            .leftJoin('flow', 'flow', 'flow.folderId = folder.id')
            .addSelect('COUNT(flow.id)::int', 'numberOfFlows')
            .where('folder.projectId = :projectId', { projectId })
            .groupBy('folder.id')

        const paginationResponse = await paginator.paginate<FolderDto>(queryBuilder)
        return paginationHelper.createPage(paginationResponse.data, paginationResponse.cursor)
    },
    async getOneByDisplayNameCaseInsensitive(params: GetOneByDisplayNameParams): Promise<Folder | null> {
        const { projectId, displayName } = params
        return folderRepo().createQueryBuilder('folder')
            .where('folder.projectId = :projectId', { projectId })
            .andWhere('LOWER(folder.displayName) = LOWER(:displayName)', { displayName })
            .getOne()
    },
    async getOneOrThrow(params: GetOneOrThrowParams): Promise<FolderDto> {
        const { projectId, folderId } = params
        const folder = await folderRepo().findOneBy({ projectId, id: folderId })
        if (!folder) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Folder ${folderId} is not found`,
                },
            })
        }
        const numberOfFlows = await flowService(log).count({ projectId, folderId })
        return {
            ...folder,
            numberOfFlows,
        }
    },
})

type DeleteParams = {
    projectId: ProjectId
    folderId: FolderId
}

type UpdateParams = {
    projectId: ProjectId
    folderId: FolderId
    request: UpdateFolderRequest
}

type UpsertParams = {
    projectId: ProjectId
    request: CreateFolderRequest
}

type ListParams = {
    projectId: ProjectId
    cursorRequest: Cursor | null
    limit: number
}

type GetOneByDisplayNameParams = {
    projectId: ProjectId
    displayName: string
}

type GetOneOrThrowParams = {
    projectId: ProjectId
    folderId: FolderId
}

type ListAllParams = {
    projectId: ProjectId
}

type UpsertByExternalIdParams = {
    projectId: ProjectId
    externalId: string
    displayName: string
    displayOrder: number
}

type DeleteByExternalIdParams = {
    projectId: ProjectId
    externalId: string
}