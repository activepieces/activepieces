import { Flag } from "@activepieces/shared";
import { databaseConnection } from "../database/database-connection";
import { getBackendUrl } from "../helper/public-ip-utils";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { FlagEntity } from "./flag.entity";

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
        id: FlagId.BACKEND_URL,
        value: await getBackendUrl(),
        created,
        updated,
      },
      {
        id: FlagId.ENVIRONMENT,
        value: system.get(SystemProp.ENVIRONMENT),
        created,
        updated,
      },
      {
        id: FlagId.SIGN_UP_ENABLED,
        value: system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false,
        created,
        updated,
      },
      {
        id: FlagId.TELEMETRY_ENABLED,
        value: system.getBoolean(SystemProp.TELEMETRY_ENABLED) ?? true,
        created,
        updated,
      },
      {
        id: FlagId.FRONTEND_URL,
        value: system.get(SystemProp.FRONTEND_URL),
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
  FRONTEND_URL = "FRONTEND_URL",
  BACKEND_URL = "BACKEND_URL",
  ENVIRONMENT = "ENVIRONMENT",
  USER_CREATED = "USER_CREATED",
  SIGN_UP_ENABLED = "SIGN_UP_ENABLED",
  TELEMETRY_ENABLED = "TELEMETRY_ENABLED",

  WARNING_TEXT_BODY = "WARNING_TEXT_BODY",
  WARNING_TEXT_HEADER = "WARNING_TEXT_HEADER",
}

export type FlagType =
  | BaseFlagStructure<FlagId.ENVIRONMENT, string>
  | BaseFlagStructure<FlagId.FRONTEND_URL, string>
  | BaseFlagStructure<FlagId.BACKEND_URL, string>
  | BaseFlagStructure<FlagId.USER_CREATED, boolean>
  | BaseFlagStructure<FlagId.TELEMETRY_ENABLED, boolean>
  | BaseFlagStructure<FlagId.WARNING_TEXT_BODY, string>
  | BaseFlagStructure<FlagId.WARNING_TEXT_HEADER, string>;

interface BaseFlagStructure<K extends FlagId, V> {
  id: K;
  value: V;
}
