import { Flag } from "@activepieces/shared";
import { FlagIds } from "@activepieces/shared";
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
  async getOne(flagId: FlagIds): Promise<Flag | null> {
    return await flagRepo.findOneBy({
      id: flagId,
    });
  },
  async getAll(): Promise<Flag[]> {
    const flags = await flagRepo.find({});
    const now = new Date().toISOString();
    const created = now;
    const updated = now;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const currentVersion = require('../../../../../package.json').version;
    const latestVersion = (await flagService.getLatestPackageDotJson()).version;
    flags.push(
      {
        id: FlagIds.BACKEND_URL,
        value: await getBackendUrl(),
        created,
        updated,
      },
      {
        id: FlagIds.SIGN_UP_ENABLED,
        value: system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false,
        created,
        updated,
      },
      {
        id: FlagIds.TELEMETRY_ENABLED,
        value: system.getBoolean(SystemProp.TELEMETRY_ENABLED) ?? true,
        created,
        updated,
      },
      {
        id: FlagIds.FRONTEND_URL,
        value: system.get(SystemProp.FRONTEND_URL),
        created,
        updated,
      },
      {
        id: FlagIds.WARNING_TEXT_BODY,
        value: system.get(SystemProp.WARNING_TEXT_BODY),
        created,
        updated,
      },
      {
        id: FlagIds.WARNING_TEXT_HEADER,
        value: system.get(SystemProp.WARNING_TEXT_HEADER),
        created,
        updated,
      },
      {
        id: FlagIds.CURRENT_VERSION,
        value: currentVersion,
        created,
        updated,
      },
      {
        id: FlagIds.LATEST_VERSION,
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


export type FlagType =
  | BaseFlagStructure<FlagIds.FRONTEND_URL, string>
  | BaseFlagStructure<FlagIds.BACKEND_URL, string>
  | BaseFlagStructure<FlagIds.USER_CREATED, boolean>
  | BaseFlagStructure<FlagIds.TELEMETRY_ENABLED, boolean>
  | BaseFlagStructure<FlagIds.WARNING_TEXT_BODY, string>
  | BaseFlagStructure<FlagIds.WARNING_TEXT_HEADER, string>;

interface BaseFlagStructure<K extends FlagIds, V> {
  id: K;
  value: V;
}
