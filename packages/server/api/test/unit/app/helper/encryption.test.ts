import * as crypto from 'crypto'
import { encryptUtils, EncryptedObject } from '../../../../src/app/helper/encryption'

process.env.AP_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef'

const KEY = Buffer.from(process.env.AP_ENCRYPTION_KEY, 'binary')

function encryptGcm(plaintext: string): EncryptedObject {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
    let data = cipher.update(plaintext, 'utf8', 'hex')
    data += cipher.final('hex')
    return { iv: iv.toString('hex'), data, authTag: cipher.getAuthTag().toString('hex') }
}

describe('encryptUtils', () => {
    it('accepts an optional authTag in the schema', () => {
        expect(EncryptedObject.safeParse({ iv: 'aa', data: 'bb' }).success).toBe(true)
        expect(EncryptedObject.safeParse({ iv: 'aa', data: 'bb', authTag: 'cc' }).success).toBe(true)
    })

    it('writes GCM (string) and round-trips it', async () => {
        const encrypted = await encryptUtils.encryptString('hello world')
        expect(encrypted.authTag).toBeDefined()
        expect(Buffer.from(encrypted.iv, 'hex')).toHaveLength(12)
        expect(await encryptUtils.decryptString(encrypted)).toBe('hello world')
    })

    it('writes GCM (object) and round-trips it', async () => {
        const value = { token: 'secret', nested: { n: 1 } }
        const encrypted = await encryptUtils.encryptObject(value)
        expect(encrypted.authTag).toBeDefined()
        expect(await encryptUtils.decryptObject(encrypted)).toEqual(value)
    })

    it('decrypts a GCM blob (string)', async () => {
        const encrypted = encryptGcm('gcm-secret')
        expect(await encryptUtils.decryptString(encrypted)).toBe('gcm-secret')
    })

    it('decrypts a GCM blob (object)', async () => {
        const value = { apiKey: 'k', scopes: ['a', 'b'] }
        const encrypted = encryptGcm(JSON.stringify(value))
        expect(await encryptUtils.decryptObject(encrypted)).toEqual(value)
    })

    it('rejects a tampered GCM ciphertext (auth tag mismatch)', async () => {
        const encrypted = encryptGcm('gcm-secret')
        const tampered = { ...encrypted, data: encrypted.data.replace(/.$/, (c) => (c === '0' ? '1' : '0')) }
        await expect(encryptUtils.decryptString(tampered)).rejects.toThrow()
    })

    it('decrypts a legacy CBC blob (no authTag)', async () => {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv)
        let data = cipher.update('legacy-cbc', 'utf8', 'hex')
        data += cipher.final('hex')
        const fixture: EncryptedObject = { iv: iv.toString('hex'), data }
        expect(await encryptUtils.decryptString(fixture)).toBe('legacy-cbc')
    })
})
