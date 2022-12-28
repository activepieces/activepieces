import {Flag} from "shared";
import {databaseConnection} from "../database/database-connection";
import {FlagEntity} from "./flag-entity";

const flagRepo = databaseConnection.getRepository(FlagEntity);

export const flagService = {
    save: async (flag: FlagType): Promise<Flag> => {
        return flagRepo.save({
            id: flag.id,
            value: flag.value
        })
    },
    async getOne(flagId: FlagId): Promise<Flag | null> {
        return flagRepo.findOneBy({
            id: flagId
        });
    },
    async getAll(): Promise<Flag[]> {
        return flagRepo.find({});
    }
};

export enum FlagId{
    USER_CREATED = "USER_CREATED"
}

export type FlagType = BaseFlagStructure<FlagId.USER_CREATED, boolean>;

interface BaseFlagStructure<K extends FlagId,V>{
    id: K,
    value: V;
}