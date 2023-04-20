import { ActivepiecesError, apId, ErrorCode, File, FileId, ProjectId } from '@activepieces/shared'
import { isNil } from 'lodash'
import { databaseConnection } from '../database/database-connection'
import { logger } from '../helper/logger'
import { FileEntity } from './file.entity'

type GetOneParams = {
    fileId: FileId
    projectId: ProjectId
}

const fileRepo = databaseConnection.getRepository<File>(FileEntity)

export const fileService = {
    async save(projectId: ProjectId, buffer: Buffer): Promise<File> {
        const savedFile = await fileRepo.save({
            id: apId(),
            projectId: projectId,
            data: buffer,
        })
        logger.info('Saved File id ' + savedFile.id + ' number of bytes ' + buffer.length)
        return savedFile
    },
    async getOne({projectId, fileId}: GetOneParams): Promise<File | null> {
        return await fileRepo.findOneBy({
            projectId: projectId,
            id: fileId,
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<File> {
        const file = await this.getOne(params)

        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.FILE_NOT_FOUND,
                params: {
                    id: params.fileId,
                },
            })
        }

        return file
    },

    async delete({ projectId, fileId }: { projectId: ProjectId, fileId: FileId }): Promise<void> {
        logger.info('Deleted file with Id ' + fileId)
        await fileRepo.delete({ id: fileId, projectId: projectId })
    },
}
