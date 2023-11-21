import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytesAsync = promisify(randomBytes)

const OTP_LENGTH = 6

export const otpGenerator = {
    async generate(): Promise<string> {
        const randomBytes = await randomBytesAsync(3)
        const randomHex = randomBytes.toString('hex')
        const randomInt = Number.parseInt(randomHex, 16)
        return randomInt.toString().substring(0, OTP_LENGTH)
    },
}
