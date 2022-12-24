import {apId, File, FileId} from 'shared';
import {databaseConnection} from "../database/database-connection";
import {FileEntity} from "./file-entity";

const fileRepo = databaseConnection.getRepository<File>(FileEntity);

export const fileService = {

    async save(buffer: Buffer): Promise<File | null> {
        let savedFile = await fileRepo.save({
            id: apId(),
            data: buffer
        });
        console.log("Saved File id " + savedFile.id + " number of bytes " + buffer.length);
        return savedFile;
    },
    async getOne(fileId: FileId): Promise<File | null> {
        return fileRepo.findOneBy({
            id: fileId
        });
    },
    async delete(fileId: FileId): Promise<void> {
        console.log("Deleted file with Id " + fileId);
        await fileRepo.delete({id: fileId})
    }
};
