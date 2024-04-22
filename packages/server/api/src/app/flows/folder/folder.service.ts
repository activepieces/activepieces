import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { flowService } from '../flow/flow.service'
import { FolderEntity } from './folder.entity'
import {
    ActivepiecesError,
    apId,
    CreateOrRenameFolderRequest,

    Cursor,
    ErrorCode,
    Folder,
    FolderDto,
    FolderId,
    isNil, ProjectId,
} from '@activepieces/shared'

export const folderRepo = databaseConnection.getRepository(FolderEntity)

export const flowFolderService = {
    async delete({
        projectId,
        folderId,
    }: {
        projectId: ProjectId
        folderId: FolderId
    }): Promise<void> {
        const folder = await this.getOneOrThrow({ projectId, folderId })
        await folderRepo.delete({
            id: folder.id,
            projectId,
        })
    },
    async update({
        projectId,
        folderId,
        request,
    }: {
        projectId: ProjectId
        folderId: FolderId
        request: CreateOrRenameFolderRequest
    }): Promise<FolderDto> {
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
        await folderRepo.update(folder.id, {
            displayName: request.displayName,
        })
        return this.getOneOrThrow({ projectId, folderId })
    },
    async upsert({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: CreateOrRenameFolderRequest
    }): Promise<FolderDto> {
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
        await folderRepo.upsert({
            id: folderId,
            projectId,
            displayName: request.displayName,
        }, ['projectId', 'displayName'])
        const folder = await folderRepo.findOneByOrFail({ projectId, id: folderId })
        return {
            ...folder,
            numberOfFlows: 0,
        }
    },
    async list({
        projectId,
        cursorRequest,
        limit,
    }: {
        projectId: ProjectId
        cursorRequest: Cursor | null
        limit: number
    }) {
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
        const paginationResponse = await paginator.paginate(
            folderRepo.createQueryBuilder('folder').where({ projectId }),
        )
        const numberOfFlowForEachFolder: Promise<number>[] = []
        const dtosList: FolderDto[] = []
        paginationResponse.data.forEach((f) => {
            numberOfFlowForEachFolder.push(
                flowService.count({ projectId, folderId: f.id }),
            )
        });
        (await Promise.all(numberOfFlowForEachFolder)).forEach((num, idx) => {
            dtosList.push({ ...paginationResponse.data[idx], numberOfFlows: num })
        })
        return paginationHelper.createPage<FolderDto>(
            dtosList,
            paginationResponse.cursor,
        )
    },
    async getOneByDisplayNameCaseInsensitive({
        projectId,
        displayName,
    }: {
        projectId: ProjectId
        displayName: string
    }): Promise<Folder | null> {
        return folderRepo.createQueryBuilder('folder')
            .where('folder.projectId = :projectId', { projectId })
            .andWhere('LOWER(folder.displayName) = LOWER(:displayName)', { displayName })
            .getOne()
    },
    async getOneOrThrow({
        projectId,
        folderId,
    }: {
        projectId: ProjectId
        folderId: FolderId
    }): Promise<FolderDto> {
        const folder = await folderRepo.findOneBy({ projectId, id: folderId })
        if (!folder) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Folder ${folderId} is not found`,
                },
            })
        }
        const numberOfFlows = await flowService.count({ projectId, folderId })
        return {
            ...folder,
            numberOfFlows,
        }
    },
}
