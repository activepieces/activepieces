import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'
import { Principal, isNil } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { localFileStore } from '../../helper/store'
import { jwtUtils } from '../../helper/jwt-utils'

let secret: string | null = null
const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

const getSecret = async (): Promise<string> => {
    if (secret !== null) {
        return secret
    }
    secret = system.get(SystemProp.JWT_SECRET) ?? null

    if (queueMode === QueueMode.MEMORY) {
        if (isNil(secret)) {
            secret = await getSecretFromStore()
        }
        if (isNil(secret)) {
            secret = await generateAndStoreSecret()
        }
    }
    if (isNil(secret)) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.JWT_SECRET,
            },
        }, `System property AP_${SystemProp.JWT_SECRET} must be defined`)
    }
    return secret
}

const getSecretFromStore = async (): Promise<string | null> => {
    return await localFileStore.load(SystemProp.JWT_SECRET)
}

const generateAndStoreSecret = async (): Promise<string> => {
    const secretLengthInBytes = 32
    const secretBuffer = await promisify(randomBytes)(secretLengthInBytes)
    const secret = secretBuffer.toString('base64')
    await localFileStore.save(SystemProp.JWT_SECRET, secret)
    return secret
}

export const accessTokenManager = {
    async generateToken(principal: Principal): Promise<string> {
        const secret = await getSecret()

        return jwtUtils.sign({
            payload: principal,
            key: secret,
        })
    },

    async extractPrincipal(token: string): Promise<Principal> {
        const secret = await getSecret()

        try {
            return await jwtUtils.decodeAndVerify({
                jwt: token,
                key: secret,
            })
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {},
            })
        }
    },
}
