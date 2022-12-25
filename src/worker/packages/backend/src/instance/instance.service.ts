import {databaseConnection} from "../database/database-connection";
import {InstanceEntity} from "./instance-entity";
import {InstanceId} from "shared";
import {Instance} from "shared";

const instanceRepo = databaseConnection.getRepository(InstanceEntity);

export const instanceService = {

    async getOne(id: InstanceId): Promise<Instance | null> {
        return instanceRepo.findOneBy({
            id: id
        });
    }
};
