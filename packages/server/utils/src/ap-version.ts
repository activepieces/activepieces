import fs from 'fs'
import path from 'path'

let cachedCurrentRelease: string | undefined
let cachedLatestRelease: string | undefined

function readCurrentRelease(): string {
    if (cachedCurrentRelease !== undefined) {
        return cachedCurrentRelease
    }
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')) as PackageJson
        cachedCurrentRelease = typeof packageJson.version === 'string' ? packageJson.version : '0.0.0'
    }
    catch {
        cachedCurrentRelease = '0.0.0'
    }
    return cachedCurrentRelease
}

export const apVersionUtil = {
    getCurrentRelease(): string {
        return readCurrentRelease()
    },
    async getLatestRelease(): Promise<string> {
        try {
            if (cachedLatestRelease) {
                return cachedLatestRelease
            }
            const response = await fetch(
                'https://raw.githubusercontent.com/activepieces/activepieces/main/package.json',
                {
                    signal: AbortSignal.timeout(5000),
                },
            )
            const data = await response.json() as PackageJson
            cachedLatestRelease = data.version
            return data.version
        }
        catch (ex) {
            return '0.0.0'
        }
    },
}

type PackageJson = {
    version: string
}
