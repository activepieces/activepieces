import { createHash, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesPromisified = promisify(randomBytes)

const generateRandomPassword = async (): Promise<string> => {
    const passwordBytes = await randomBytesPromisified(32)
    return passwordBytes.toString('hex')
}

function hashSHA256(input: string): string {
    const hash = createHash('sha256')
    hash.update(input)
    return hash.digest('hex')
}

export const cryptoUtils = {
    generateRandomPassword,
    hashSHA256,
}