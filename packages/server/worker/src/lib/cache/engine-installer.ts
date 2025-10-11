import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { systemConstants } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { workerMachine } from '../utils/machine'
import { cacheState, NO_SAVE_GUARD } from './cache-state'

const engineExecutablePath = systemConstants.ENGINE_EXECUTABLE_PATH
const ENGINE_CACHE_ID = nanoid()
const ENGINE_INSTALLED = 'ENGINE_INSTALLED'


export const engineInstaller = (_log: FastifyBaseLogger) => ({
    async install({ path }: InstallParams): Promise<EngineInstallResult> {
        const isDev = workerMachine.getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        const cache = cacheState(path)
        const { cacheHit } = await cache.getOrSetCache(ENGINE_INSTALLED, () => Promise.resolve(ENGINE_CACHE_ID), (key: string) => {
            const isEngineInstalled = key == ENGINE_CACHE_ID
            return !isEngineInstalled || isDev
        }, async () => {
            await atomicCopy(engineExecutablePath, `${path}/main.js`)
            await atomicCopy(`${engineExecutablePath}.map`, `${path}/main.js.map`)
        }, NO_SAVE_GUARD)     
        return { cacheHit }
    },
})

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, 'engine.temp.js')
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type InstallParams = {
    path: string
}
type EngineInstallResult = {
    cacheHit: boolean
}