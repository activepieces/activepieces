import { access } from 'node:fs/promises'

export const fileExists = async (path: string): Promise<boolean> => {
    try {
        await access(path)
        return true
    }
    catch (e) {
        const castedError = e as Error
        if ('code' in castedError && castedError.code === 'ENOENT') {
            return false
        }

        throw e
    }
}
