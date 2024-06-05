import * as crypto from 'crypto'
import { randomBytes } from 'node:crypto'
import { promisify } from 'util'
import { localFileStore } from './store'
import { QueueMode, system, SystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
} from '@activepieces/shared'

let secret: string | null
const algorithm = 'aes-256-cbc'
const ivLength = 16

export type EncryptedObject = {
    iv: string
    data: string
}

const loadEncryptionKey = async (queueMode: QueueMode): Promise<void> => {
    secret = system.get(SystemProp.ENCRYPTION_KEY) ?? null
    if (queueMode === QueueMode.MEMORY) {
        if (isNil(secret)) {
            secret = await localFileStore.load(SystemProp.ENCRYPTION_KEY)
        }
        if (isNil(secret)) {
            secret = await generateAndStoreSecret()
        }
    }
    if (isNil(secret)) {
        throw new ActivepiecesError(
            {
                code: ErrorCode.SYSTEM_PROP_INVALID,
                params: {
                    prop: SystemProp.ENCRYPTION_KEY,
                },
            },
            `System property AP_${SystemProp.ENCRYPTION_KEY} must be defined`,
        )
    }
}

const generateAndStoreSecret = async (): Promise<string> => {
    const secretLengthInBytes = 16
    const secretBuffer = await promisify(randomBytes)(secretLengthInBytes)
    const secret = secretBuffer.toString('hex') // Convert to hexadecimal
    await localFileStore.save(SystemProp.ENCRYPTION_KEY, secret)
    return secret
}


function encryptString(inputString: string): EncryptedObject {
    const iv = crypto.randomBytes(ivLength) // Generate a random initialization vector
    assertNotNullOrUndefined(secret, 'secret')
    const key = Buffer.from(secret, 'binary')
    const cipher = crypto.createCipheriv(algorithm, key, iv) // Create a cipher with the key and initialization vector
    let encrypted = cipher.update(inputString, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return {
        iv: iv.toString('hex'),
        data: encrypted,
    }
}

function encryptObject(object: unknown): EncryptedObject {
    const objectString = JSON.stringify(object) // Convert the object to a JSON string
    return encryptString(objectString)
}

function decryptObject<T>(encryptedObject: EncryptedObject): T {
    const iv = Buffer.from(encryptedObject.iv, 'hex')
    const key = Buffer.from(secret!, 'binary')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted)
}
function decryptString(encryptedObject: EncryptedObject): string {
    const iv = Buffer.from(encryptedObject.iv, 'hex')
    const key = Buffer.from(secret!, 'binary')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

function hashObject(object: Record<string, unknown>) {
    const algorithm = 'sha256'
    const hash = crypto.createHash(algorithm)
    hash.update(JSON.stringify(object))
    return hash.digest('hex')
}

function get16ByteKey(): string {
    assertNotNullOrUndefined(secret, 'secret is not defined')
    return secret
}

export const encryptUtils = {
    hashObject,
    decryptString,
    decryptObject,
    encryptObject,
    encryptString,
    get16ByteKey,
    loadEncryptionKey,
}