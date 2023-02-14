import { Flag } from "@activepieces/shared";
import { databaseConnection } from "../database/database-connection";
import { getBackendUrl } from "../helper/public-ip-utils";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { FlagEntity } from "./flag.entity";
import axios from "axios";
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
    const currentVersion = require('../../../../../package.json').version;
    const latestVersion = (await flagService.getLatestPackageDotJson()).version;
    flags.push(
      {
        id: FlagId.BACKEND_URL,
        value: await getBackendUrl(),
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
      },
      {
        id: FlagId.CURRENT_VERSION,
        value: currentVersion,
        created,
        updated,
      },
      {
        id: FlagId.LATEST_VERSION,
        value: latestVersion,
        created,
        updated,
      }
    );

    return flags;
  },
  async getLatestPackageDotJson() {
    try {
      const pkgJson = (await axios.get("https://raw.githubusercontent.com/activepieces/activepieces/main/package.json")).data;
      return pkgJson;
    } catch (ex) {
      return { version: '0.0.0' }
    }
  }
};

export enum FlagId {
  FRONTEND_URL = "FRONTEND_URL",
  BACKEND_URL = "BACKEND_URL",
  USER_CREATED = "USER_CREATED",
  SIGN_UP_ENABLED = "SIGN_UP_ENABLED",
  TELEMETRY_ENABLED = "TELEMETRY_ENABLED",
  CURRENT_VERSION = "CURRENT_VERSION",
  LATEST_VERSION = "LATEST_VERSION",
  WARNING_TEXT_BODY = "WARNING_TEXT_BODY",
  WARNING_TEXT_HEADER = "WARNING_TEXT_HEADER",
}

export type FlagType =
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
