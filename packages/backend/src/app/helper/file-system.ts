import { access } from 'node:fs/promises'

export const fileExists = async (path: string): Promise<boolean> => {
    try {
        await access(path)
        return true
    }
    catch (e) {
        if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
            return false
        }

        throw e
    }
}
