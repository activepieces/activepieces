import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { SystemProp } from "./system-prop";

export const system = {
    get(prop: SystemProp): string | undefined {
        return getEnvVar(prop);
    },

    getNumber(prop: SystemProp): number | null {
        const stringNumber = getEnvVar(prop);

        if (!stringNumber) {
            return null;
        }

        const parsedNumber = Number.parseInt(stringNumber, 10);

        if (Number.isNaN(parsedNumber)) {
            return null;
        }

        return parsedNumber;
    },

    getBoolean(prop: SystemProp): boolean | undefined {
        const env = getEnvVar(prop);
        if (env === undefined) {
            return undefined;
        }
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
            }, `System property AP_${prop} is not defined, please check the documentation`);
        }

        return value;
    },
};

const getEnvVar = (prop: SystemProp): string | undefined => {
    const value = process.env[`AP_${prop}`];
    console.log(`[system#getEnvVar] prop=${prop} value=${value}`);
    return value;
};

export const validateEnvPropsOnStartup = () => {
    const encryptionKey = system.getOrThrow(SystemProp.ENCRYPTION_KEY);
    const encryptionKeyLength = Buffer.from(encryptionKey, "binary");
    if(encryptionKeyLength.length !== 32) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.ENCRYPTION_KEY,
            },
        }, `System property AP_${SystemProp.ENCRYPTION_KEY} must be 256 bit (32 hex charaters)`);
    }
}