import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileSystemUtils } from '@activepieces/server-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { nanoid } from 'nanoid'
import { cacheUtils } from '../cache-paths'

// The engine is a static artifact per build: it is baked into the prod image and rebuilt
// in place by esbuild --watch in dev. The sandbox can only see what is mounted at
// /root/common, so the bundle is placed there once at boot rather than re-installed per run.
// In dev the esbuild --watch onEnd hook re-copies on every rebuild to keep this fresh.
const ENGINE_SOURCE = 'dist/packages/engine/main.js'

const installs = new Map<string, Promise<void>>()

export function installEngine({ basePath, log }: InstallEngineParams): Promise<void> {
    const existing = installs.get(basePath)
    if (!existing) {
        const promise = copyEngineToCommon({ basePath, log }).catch((error) => {
            installs.delete(basePath)
            throw error
        })
        installs.set(basePath, promise)
        return promise
    }
    return existing
}

async function copyEngineToCommon({ basePath, log }: InstallEngineParams): Promise<void> {
    const commonPath = cacheUtils(basePath).getGlobalCacheCommonPath()
    await fileSystemUtils.threadSafeMkdir(commonPath)
    await atomicCopy(ENGINE_SOURCE, join(commonPath, 'main.js'))
    await atomicCopy(`${ENGINE_SOURCE}.map`, join(commonPath, 'main.js.map'))
    log.info({ path: commonPath }, 'Installed engine in sandbox')
}

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `engine.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type InstallEngineParams = {
    basePath: string
    log: ApLogger
}
