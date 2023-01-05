import { Flag } from "shared";
import { databaseConnection } from "../database/database-connection";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { FlagEntity } from "./flag-entity";

const flagRepo = databaseConnection.getRepository(FlagEntity);

export const flagService = {
  save: async (flag: FlagType): Promise<Flag> => {
    return await flagRepo.save({
      id: flag.id,
      value: flag.value,
    });
  },
  async getOne(flagId: FlagId): Promise<Flag | null> {
    return await flagRepo.findOneBy({
      id: flagId,
    });
  },
  async getAll(): Promise<Flag[]> {
    const flags = await flagRepo.find({});

    flags.push({
      id: FlagId.SERVER_URL,
      value: system.get(SystemProp.SERVER_URL),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });

    return flags;
  },
};

export enum FlagId {
  SERVER_URL = "SERVER_URL",
  USER_CREATED = "USER_CREATED",
}

export type FlagType =
  | BaseFlagStructure<FlagId.SERVER_URL, string>
  | BaseFlagStructure<FlagId.USER_CREATED, boolean>;

interface BaseFlagStructure<K extends FlagId, V> {
  id: K;
  value: V;
}
