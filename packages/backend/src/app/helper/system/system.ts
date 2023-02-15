import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { SystemProp } from "./system-prop";

export const system = {
  get(prop: SystemProp): string | undefined {
    return getEnvVar(prop);
  },

  getNumber(prop: SystemProp): number | undefined {
    const number = getEnvVar(prop);
    if(number === undefined) {
      return undefined;
    }
    return Number(number);
  },

  getBoolean(prop: SystemProp): boolean | undefined {
    return getEnvVar(prop) === "true";
  },

  getOrThrow(prop: SystemProp): string {
    const value = getEnvVar(prop);

    if (value === undefined) {
      throw new ActivepiecesError({
        code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
        params: {
          prop,
        },
      });
    }

    return value;
  },
};

const getEnvVar = (prop: SystemProp): string | undefined => {
  const value = process.env[`AP_${prop}`];
  console.log(`[system#getEnvVar] prop=${prop} value=${value}`);
  return value;
};
