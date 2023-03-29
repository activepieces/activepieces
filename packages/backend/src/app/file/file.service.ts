import { apId, File, FileId, ProjectId } from '@activepieces/shared';
import { databaseConnection } from '../database/database-connection';
import { logger } from '../helper/logger';
import { FileEntity } from './file.entity';

const fileRepo = databaseConnection.getRepository<File>(FileEntity);

export const fileService = {
    async save(projectId: ProjectId, buffer: Buffer): Promise<File> {
        const savedFile = await fileRepo.save({
            id: apId(),
            projectId: projectId,
            data: buffer,
        });
        logger.info('Saved File id ' + savedFile.id + ' number of bytes ' + buffer.length);
        return savedFile;
    },
    async getOne({projectId, fileId}: {fileId: FileId, projectId: ProjectId}): Promise<File | null> {
        return await fileRepo.findOneBy({
            projectId: projectId,
            id: fileId,
        });
    },
    async delete({ projectId, fileId }: { projectId: ProjectId, fileId: FileId }): Promise<void> {
        logger.info('Deleted file with Id ' + fileId);
        await fileRepo.delete({ id: fileId, projectId: projectId });
    },
};
