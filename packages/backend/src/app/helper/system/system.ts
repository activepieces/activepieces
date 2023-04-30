import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { SystemProp } from './system-prop'
import fs from 'fs'


export const system = {
    get(prop: SystemProp): string | undefined {
        return getEnvVar(prop)
    },

    getNumber(prop: SystemProp): number | null {
        const stringNumber = getEnvVar(prop)

        if (!stringNumber) {
            return null
        }

        const parsedNumber = Number.parseInt(stringNumber, 10)

        if (Number.isNaN(parsedNumber)) {
            return null
        }

        return parsedNumber
    },

    getBoolean(prop: SystemProp): boolean | undefined {
        const env = getEnvVar(prop)
        if (env === undefined) {
            return undefined
        }
        return getEnvVar(prop) === 'true'
    },

    getOrThrow(prop: SystemProp): string {
        const value = getEnvVar(prop)

        if (value === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                params: {
                    prop,
                },
            }, `System property AP_${prop} is not defined, please check the documentation`)
        }

        return value
    },
}

const getEnvVar = (prop: SystemProp): string | undefined => {
    const value = process.env[`AP_${prop}`]
    return value
}

export const validateEnvPropsOnStartup = () => {
    const encryptionKey = system.getOrThrow(SystemProp.ENCRYPTION_KEY)
    const encryptionKeyLength = Buffer.from(encryptionKey, 'binary')
    if (encryptionKeyLength.length !== 32) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.ENCRYPTION_KEY,
            },
        }, `System property AP_${SystemProp.ENCRYPTION_KEY} must be 256 bit (32 hex charaters)`)
    }

    const executionMode = system.getOrThrow(SystemProp.EXECUTION_MODE)
    const signedUpEnabled = system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false
    if (executionMode === ExecutionMode.SANDBOXED && !hasPrivilegedAccess()) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.EXECUTION_MODE,
            },
        }, `The docker container must be run with the --privileged flag to be able to sandbox the execution of the user code, or change the value of AP_${SystemProp.EXECUTION_MODE}, please check the documentation`)
    }
    if(executionMode === ExecutionMode.UNSANDBOXED && signedUpEnabled){
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.EXECUTION_MODE,
            },
        }, `Allowing users to sign up is not allowed in unsandboxed mode, please change the value of AP_${SystemProp.EXECUTION_MODE}, please check the documentation`)
    }
}

function hasPrivilegedAccess() {
    const data = fs.readFileSync('/proc/self/status', 'utf8')
    const lines = data.split('\n')
    for (const line of lines) {
        if (line.startsWith('CapEff:')) {
            const value = line.split('\t')[1]
            return value === '0000003fffffffff'
        }
    }
    return false
}


export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    UNSANDBOXED = 'UNSANDBOXED',
}