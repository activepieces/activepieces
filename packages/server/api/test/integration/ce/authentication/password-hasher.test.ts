import bcrypt from 'bcrypt'
import { passwordHasher } from '../../../../src/app/authentication/lib/password-hasher'

const SCRYPT_SEPARATOR = '~'

describe('Password Hasher', () => {
    const plainTextPassword = 'password123'

    describe('hash', () => {
        it('should not produce the same hash for the same password', async () => {
            const hashedPassword1 = await bcrypt.hash(plainTextPassword, 10)
            const hashedPassword2 = await bcrypt.hash(plainTextPassword, 10)

            expect(hashedPassword1).not.toBe(hashedPassword2)
        })

        it('should verify hashed password correctly', async () => {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10)

            const result = await bcrypt.compare(plainTextPassword, hashedPassword)
            expect(result).toBe(true)
        })

        it('should fail to verify incorrect password', async () => {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10)
            const incorrectPassword = 'incorrectPassword'

            const result = await bcrypt.compare(incorrectPassword, hashedPassword)

            expect(result).toBe(false)
        })
    })

    describe('compare', () => {
        it('should return true for identical bcrypt passwords', async () => {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10)
            const result = await passwordHasher.compare(
                plainTextPassword,
                hashedPassword,
            )
            expect(result).toBe(true)
        })

        it('should return false for different bcrypt passwords', async () => {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10)
            const differentPassword = 'differentPassword'
            const result = await passwordHasher.compare(
                differentPassword,
                hashedPassword,
            )
            expect(result).toBe(false)
        })

        it('should return false for empty password bcrypt comparison', async () => {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10)
            const result = await passwordHasher.compare('', hashedPassword)
            expect(result).toBe(false)
        })

        it('should return false for empty hash comparison', async () => {
            const result = await passwordHasher.compare(plainTextPassword, '')
            expect(result).toBe(false)
        })

        it('should return false for both empty password and hash', async () => {
            const result = await passwordHasher.compare('', '')
            expect(result).toBe(false)
        })
    })

    describe('compare - Scrypt', () => {
        const plainTextPassword = 'BusyBeaver$LOL99'
        const salt = 'sPtDhWcd1MfdAw=='
        const hashedPassword =
      'iu1iqj6i6g9D7aBiE/Qdqv88GNnV/Ea67JK1kfLmzNgxsyCL8mhUxxI5VIHM9D+62xGHuZgjrfEBF+17wxyFIQ=='

        it('should return true for identical scrypt passwords', async () => {
            const result = await passwordHasher.compare(
                plainTextPassword,
                `$scrypt$${hashedPassword}${SCRYPT_SEPARATOR}${salt}`,
            )
            expect(result).toBe(true)
        })

        it('should return false for different scrypt passwords', async () => {
            const differentPassword = 'differentPassword'
            const result = await passwordHasher.compare(
                differentPassword,
                `$scrypt$${hashedPassword}${SCRYPT_SEPARATOR}${salt}`,
            )
            expect(result).toBe(false)
        })
    })
})
