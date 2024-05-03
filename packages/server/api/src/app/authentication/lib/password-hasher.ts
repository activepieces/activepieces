import bcrypt from 'bcrypt'
import { FirebaseScrypt } from 'firebase-scrypt'
import { system, SystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'

const SALT_ROUNDS = 10
const SCRYPT_SEPARATOR = '~'

export const passwordHasher = {
    hash: async (plainTextPassword: string): Promise<string> => {
        return bcrypt.hash(plainTextPassword, SALT_ROUNDS)
    },

    compare: async (
        plainTextPassword: string,
        hashedPassword: string,
    ): Promise<boolean> => {
        assertNotNullOrUndefined(plainTextPassword, 'plainTextPassword')
        assertNotNullOrUndefined(hashedPassword, 'hashedPassword')
        if (isBcryptHash(hashedPassword)) {
            return bcrypt.compare(plainTextPassword, hashedPassword)
        }
        if (isScrypt(hashedPassword)) {
            const salt = hashedPassword.split(SCRYPT_SEPARATOR)[1]
            const rawHashedPassword = hashedPassword
                .split(SCRYPT_SEPARATOR)[0]
                .substring('$scrypt$'.length)
            return compareScrypt(plainTextPassword, salt, rawHashedPassword)
        }
        return false
    },
}

async function compareScrypt(
    password: string,
    salt: string,
    hashedPassword: string,
): Promise<boolean> {
    const firebaseParameter = JSON.parse(
        system.getOrThrow(SystemProp.FIREBASE_HASH_PARAMETERS),
    )
    const firebaseScrypt = new FirebaseScrypt(firebaseParameter)
    return firebaseScrypt.verify(password, salt, hashedPassword)
}

function isBcryptHash(hash: string): boolean {
    return hash.startsWith('$2')
}

function isScrypt(hash: string): boolean {
    return hash.startsWith('$scrypt$')
}
