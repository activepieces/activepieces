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

    const now = new Date().toISOString();
    const created = now;
    const updated = now;

    flags.push(
      {
        id: FlagId.API_URL,
        value: system.get(SystemProp.API_URL),
        created,
        updated,
      },
      {
        id: FlagId.SERVER_URL,
        value: system.get(SystemProp.SERVER_URL),
        created,
        updated,
      },
      {
        id: FlagId.WARNING_TEXT_BODY,
        value: system.get(SystemProp.WARNING_TEXT_BODY),
        created,
        updated,
      },
      {
        id: FlagId.WARNING_TEXT_HEADER,
        value: system.get(SystemProp.WARNING_TEXT_HEADER),
        created,
        updated,
      }
    );

    return flags;
  },
};

export enum FlagId {
  SERVER_URL = "SERVER_URL",
  API_URL = "API_URL",
  USER_CREATED = "USER_CREATED",
  WARNING_TEXT_BODY = "WARNING_TEXT_BODY",
  WARNING_TEXT_HEADER = "WARNING_TEXT_HEADER",
}

export type FlagType =
  | BaseFlagStructure<FlagId.SERVER_URL, string>
  | BaseFlagStructure<FlagId.API_URL, string>
  | BaseFlagStructure<FlagId.USER_CREATED, boolean>
  | BaseFlagStructure<FlagId.WARNING_TEXT_BODY, string>
  | BaseFlagStructure<FlagId.WARNING_TEXT_HEADER, string>;

interface BaseFlagStructure<K extends FlagId, V> {
  id: K;
  value: V;
}
