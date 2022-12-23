import {File, User} from 'shared';
import {databaseConnection} from "../database/database-connection";
import {FileEntity} from "./file-entity";
import {FileId} from "shared/dist/model/file";

const fileRepo = databaseConnection.getRepository<File>(FileEntity);

export const fileService = {

    async getOne(fileId: FileId): Promise<File | null> {
        return fileRepo.findOneBy({
            id: Object(fileId)
        });
    }
};
