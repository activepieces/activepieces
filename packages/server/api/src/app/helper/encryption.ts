import * as crypto from 'crypto'
import { randomBytes } from 'node:crypto'
import { promisify } from 'util'

import { assertNotNullOrUndefined, isNil } from '@activepieces/core-utils'
import { Mutex } from 'async-mutex'
import { z } from 'zod'
import { RedisType } from '../database/redis/types'
import { redisConnections } from '../database/redis-connections'
import { localFileStore } from './local-store'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

const cbcAlgorithm = 'aes-256-cbc'
const gcmAlgorithm = 'aes-256-gcm'
const gcmIvLength = 12
const mutexLock = new Mutex()

export const EncryptedObject = z.object({
    iv: z.string(),
    data: z.string(),
    authTag: z.string().optional(),
})
export type EncryptedObject = z.infer<typeof EncryptedObject>
const redisType = redisConnections.getRedisType()


export const encryptUtils = {
    decryptString: async (encryptedObject: EncryptedObject): Promise<string> => {
        const secret = await encryptUtils.getEncryptionKey()
        assertNotNullOrUndefined(secret, 'secret')
        const iv = Buffer.from(encryptedObject.iv, 'hex')
        const key = Buffer.from(secret, 'binary')
        const { authTag } = encryptedObject
        const decipher = isNil(authTag)
            ? crypto.createDecipheriv(cbcAlgorithm, key, iv)
            : createGcmDecipher({ key, iv, authTag })
        let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    },
    decryptObject: async <T>(encryptedObject: EncryptedObject): Promise<T> => {
        return JSON.parse(await encryptUtils.decryptString(encryptedObject))
    },
    encryptObject: async (object: unknown): Promise<EncryptedObject> => {
        const objectString = JSON.stringify(object)
        return encryptUtils.encryptString(objectString)
    },
    encryptString: async (inputString: string): Promise<EncryptedObject> => {
        const secret = await encryptUtils.getEncryptionKey()
        assertNotNullOrUndefined(secret, 'secret')
        const iv = crypto.randomBytes(gcmIvLength)
        const key = Buffer.from(secret, 'binary')
        const cipher = crypto.createCipheriv(gcmAlgorithm, key, iv)
        let encrypted = cipher.update(inputString, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        return {
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: cipher.getAuthTag().toString('hex'),
        }
    },
    getEncryptionKey: async (): Promise<string | null> => {
        const secret = system.get(AppSystemProp.ENCRYPTION_KEY) ?? null
        if (!isNil(secret)) {
            return secret
        }
        if (redisType === RedisType.MEMORY) {
            return generateAndStoreSecret()
        }
        return null
    },
}


function createGcmDecipher({ key, iv, authTag }: { key: Buffer, iv: Buffer, authTag: string }): crypto.DecipherGCM {
    const decipher = crypto.createDecipheriv(gcmAlgorithm, key, iv)
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    return decipher
}

function generateAndStoreSecret(): Promise<string> {
    return mutexLock.runExclusive(async () => {
        const storedSecret = await localFileStore.load(AppSystemProp.ENCRYPTION_KEY)
        if (!isNil(storedSecret)) {
            return storedSecret
        }
        const secretLengthInBytes = 16
        const secretBuffer = await promisify(randomBytes)(secretLengthInBytes)
        const secret = secretBuffer.toString('hex')
        await localFileStore.save(AppSystemProp.ENCRYPTION_KEY, secret)
        return secret
    })
}