import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export const passwordHasher = {
    hash: async (plainTextPassword: string): Promise<string> => {
        return await bcrypt.hash(plainTextPassword, SALT_ROUNDS)
    },

    compare: async (plainTextPassword: string, hashedPassword: string): Promise<boolean> => {
        return await bcrypt.compare(plainTextPassword, hashedPassword)
    },
}
