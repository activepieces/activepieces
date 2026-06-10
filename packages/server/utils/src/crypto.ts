import { createHash, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesPromisified = promisify(randomBytes)

export const cryptoUtils = {
    async generateRandomPassword(): Promise<string> {
        const passwordBytes = await randomBytesPromisified(32)
        return passwordBytes.toString('hex')
    },
    hashSHA256(input: string): string {
        const hash = createHash('sha256')
        hash.update(input)
        return hash.digest('hex')
    },
    async hashObject(obj: Record<string, unknown>): Promise<string> {
        return cryptoUtils.hashSHA256(JSON.stringify(obj))
    },
}
