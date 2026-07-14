import * as crypto from 'crypto'
import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { EncryptedObject, encryptUtils } from '../../../../src/app/helper/encryption'
import { reencryptAllSecrets } from '../../../../src/app/helper/reencrypt-secrets.job'
import { db } from '../../../helpers/db'
import { createMockConnection, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function encryptCbc(plaintext: string): Promise<EncryptedObject> {
    const secret = await encryptUtils.getEncryptionKey()
    assertNotNullOrUndefined(secret, 'secret')
    const key = Buffer.from(secret, 'binary')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let data = cipher.update(plaintext, 'utf8', 'hex')
    data += cipher.final('hex')
    return { iv: iv.toString('hex'), data }
}

async function seedConnection({ platformId, projectId, ownerId, value }: { platformId: string, projectId: string, ownerId: string, value: EncryptedObject }): Promise<string> {
    const base = createMockConnection({ platformId, projectIds: [projectId] }, ownerId)
    const row = { ...base, value }
    await db.save('app_connection', row)
    return base.id
}

describe('reencryptAllSecrets sweep (CBC → GCM)', () => {
    it('re-encrypts legacy CBC blobs to GCM and preserves the plaintext', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()

        const secretA = 'super-secret-token-A'
        const secretB = 'super-secret-token-B'
        const idA = await seedConnection({ platformId: mockPlatform.id, projectId: mockProject.id, ownerId: mockOwner.id, value: await encryptCbc(secretA) })
        const idB = await seedConnection({ platformId: mockPlatform.id, projectId: mockProject.id, ownerId: mockOwner.id, value: await encryptCbc(secretB) })

        await reencryptAllSecrets(mockLog)

        const rowA = await db.findOneByOrFail<{ value: EncryptedObject }>('app_connection', { id: idA })
        const rowB = await db.findOneByOrFail<{ value: EncryptedObject }>('app_connection', { id: idB })

        expect(rowA.value.authTag).toBeDefined()
        expect(rowB.value.authTag).toBeDefined()
        expect(Buffer.from(rowA.value.iv, 'hex')).toHaveLength(12)
        expect(await encryptUtils.decryptString(rowA.value)).toBe(secretA)
        expect(await encryptUtils.decryptString(rowB.value)).toBe(secretB)
    })

    it('leaves already-GCM blobs untouched (conditional predicate skips them)', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()

        const gcmValue = await encryptUtils.encryptString('already-gcm-secret')
        const id = await seedConnection({ platformId: mockPlatform.id, projectId: mockProject.id, ownerId: mockOwner.id, value: gcmValue })

        await reencryptAllSecrets(mockLog)

        const row = await db.findOneByOrFail<{ value: EncryptedObject }>('app_connection', { id })
        expect(row.value).toEqual(gcmValue)
    })
})
