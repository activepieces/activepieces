import fs from 'fs'
import path from 'path'

let cachedCurrentRelease: string | undefined

function readCurrentRelease(): string {
    if (cachedCurrentRelease !== undefined) {
        return cachedCurrentRelease
    }
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')) as { version?: string }
        cachedCurrentRelease = typeof packageJson.version === 'string' ? packageJson.version : '0.0.0'
    }
    catch {
        cachedCurrentRelease = '0.0.0'
    }
    return cachedCurrentRelease
}

export const apVersion = {
    getCurrentRelease(): string {
        return readCurrentRelease()
    },
}
