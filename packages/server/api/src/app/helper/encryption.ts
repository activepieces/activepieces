import * as crypto from 'crypto'
import { randomBytes } from 'node:crypto'
import { promisify } from 'util'

import { AppSystemProp, RedisType } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    isNil,
} from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Mutex } from 'async-mutex'
import { redisConnections } from '../database/redis-connections'
import { localFileStore } from './local-store'
import { system } from './system/system'

const algorithm = 'aes-256-cbc'
const ivLength = 16
const mutexLock = new Mutex()

export const EncryptedObject = Type.Composite([Type.Object({
    iv: Type.String(),
    data: Type.String(),
})])
export type EncryptedObject = Static<typeof EncryptedObject>
const redisType = redisConnections.getRedisType()


export const encryptUtils = {
    decryptString: async (encryptedObject: EncryptedObject): Promise<string> => {
        const secret = await encryptUtils.getEncryptionKey()
        const iv = Buffer.from(encryptedObject.iv, 'hex')
        const key = Buffer.from(secret!, 'binary')
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    },
    decryptObject: async <T>(encryptedObject: EncryptedObject): Promise<T> => {
        const secret = await encryptUtils.getEncryptionKey()
        const iv = Buffer.from(encryptedObject.iv, 'hex')
        const key = Buffer.from(secret!, 'binary')
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return JSON.parse(decrypted)
    },
    encryptObject: async (object: unknown): Promise<EncryptedObject> => {
        const objectString = JSON.stringify(object)
        return encryptUtils.encryptString(objectString)
    },
    encryptString: async (inputString: string): Promise<EncryptedObject> => {
        const secret = await encryptUtils.getEncryptionKey()
        const iv = crypto.randomBytes(ivLength)
        assertNotNullOrUndefined(secret, 'secret')
        const key = Buffer.from(secret, 'binary')
        const cipher = crypto.createCipheriv(algorithm, key, iv)
        let encrypted = cipher.update(inputString, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        return {
            iv: iv.toString('hex'),
            data: encrypted,
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