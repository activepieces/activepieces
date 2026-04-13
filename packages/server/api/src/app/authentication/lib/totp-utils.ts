import { randomBytes } from 'node:crypto'
import * as bcrypt from 'bcrypt'
import * as OTPAuth from 'otpauth'
import * as qrcode from 'qrcode'
import { encryptUtils } from '../../helper/encryption'

export const totpUtils = {
    async generateSecret({ email, issuer }: { email: string, issuer: string }): Promise<{ secret: string, otpauthUrl: string, qrCodeDataUrl: string }> {
        const secret = new OTPAuth.Secret({ size: 20 }).base32
        const totp = new OTPAuth.TOTP({
            issuer,
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret,
        })
        const otpauthUrl = totp.toString()
        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl)
        return { secret, otpauthUrl, qrCodeDataUrl }
    },

    verifyCode({ secret, code }: { secret: string, code: string }): boolean {
        const totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret,
        })
        const delta = totp.validate({ token: code, window: 1 })
        return delta !== null
    },

    generateBackupCodes(): string[] {
        const codes: string[] = []
        for (let i = 0; i < 8; i++) {
            const bytes = randomBytes(6)
            codes.push(bytes.toString('hex').toUpperCase().slice(0, 8))
        }
        return codes
    },

    async hashBackupCode({ code }: { code: string }): Promise<string> {
        return bcrypt.hash(code, 10)
    },

    async verifyBackupCode({ code, hash }: { code: string, hash: string }): Promise<boolean> {
        return bcrypt.compare(code, hash)
    },

    async encryptSecret({ secret }: { secret: string }): Promise<string> {
        const encrypted = await encryptUtils.encryptString(secret)
        return JSON.stringify(encrypted)
    },

    async decryptSecret({ encryptedSecret }: { encryptedSecret: string }): Promise<string> {
        const encrypted = JSON.parse(encryptedSecret)
        return encryptUtils.decryptString(encrypted)
    },
}
