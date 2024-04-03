import { createHash, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesPromisified = promisify(randomBytes)

export const generateRandomPassword = async (): Promise<string> => {
    const passwordBytes = await randomBytesPromisified(32)
    return passwordBytes.toString('hex')
}

export function hashSHA256(input: string): string {
    const hash = createHash('sha256')
    hash.update(input)
    return hash.digest('hex')
}
