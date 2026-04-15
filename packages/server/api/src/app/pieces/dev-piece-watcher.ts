import { spawn } from 'node:child_process'
import { copyFile, cp } from 'node:fs/promises'
import { join } from 'path'
import { memoryLock } from '@activepieces/server-utils'
import { isNil, WebsocketClientEvent } from '@activepieces/shared'
import chokidar from 'chokidar'
import { FastifyInstance } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { filePiecesUtils } from './metadata/utils/file-pieces-utils'

const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function buildPieces(app: FastifyInstance, piecesInfo: PieceInfo[]): Promise<void> {
    if (piecesInfo.length === 0) return

    for (const piece of piecesInfo) {
        if (!/^[A-Za-z0-9-]+$/.test(piece.pieceName)) {
            throw new Error(`Piece package name contains invalid character: ${piece.pieceName}`)
        }
    }

    const pieceFilters = piecesInfo.map(p => `--filter=${p.packageName}`)
    const filterArgs = [
        '--filter=@activepieces/pieces-framework',
        '--filter=@activepieces/pieces-common',
        '--filter=@activepieces/shared',
        ...pieceFilters,
        '--force',
    ]
    app.log.info(`Building ${piecesInfo.length} piece(s): ${piecesInfo.map(p => p.pieceName).join(',')}...`)

    const lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)
    try {
        const startTime = performance.now()
        await spawnAndWait('npx', ['turbo', 'run', 'build', ...filterArgs])
        const buildTime = (performance.now() - startTime) / 1000

        app.log.info(`Build completed in ${buildTime.toFixed(2)} seconds`)

        const utils = filePiecesUtils(app.log)
        await Promise.all(piecesInfo.map(async (piece) => {
            await copyPackageJsonToDist(piece.pieceDirectory)
            await copyI18nToDist(piece.pieceDirectory)
            const distPath = await utils.findDistPiecePathByPackageName(piece.packageName)
            if (distPath) {
                utils.clearPieceModuleCache(distPath)
            }
        }))

        app.io.emit(WebsocketClientEvent.REFRESH_PIECE)
        app.log.info('Changes are ready! Please refresh the frontend to see the new updates.')
    }
    catch (error) {
        app.log.error({ err: error }, 'Failed to run build process...')
    }
    finally {
        await lock.release()
    }
}

export async function startDevPieceWatcher(app: FastifyInstance): Promise<void> {
    const devPiecesConfig = system.get(AppSystemProp.DEV_PIECES)
    if (isNil(devPiecesConfig) || devPiecesConfig.trim() === '') return

    const piecesNames = [...new Set(devPiecesConfig.split(',').map(n => n.trim()))]
    const utils = filePiecesUtils(app.log)

    const resolvedInfos = await Promise.all(piecesNames.map(async (pieceName) => {
        const pieceDirectory = await utils.findSourcePiecePathByPieceName(pieceName)
        if (isNil(pieceDirectory)) {
            app.log.warn(`Piece directory not found for: ${pieceName}`)
            return null
        }
        const packageName = await utils.getPackageNameFromFolderPath(pieceDirectory)
        return { pieceName, pieceDirectory, packageName }
    }))
    const pieceInfos: PieceInfo[] = resolvedInfos.filter((info): info is PieceInfo => info !== null)

    if (pieceInfos.length === 0) return

    const rebuilding = new Set<string>()
    const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
    const pendingRebuild = new Set<string>()

    const watchPaths = pieceInfos.flatMap(p => [
        join(p.pieceDirectory, 'src'),
        join(p.pieceDirectory, 'package.json'),
    ])

    const triggerBuild = async (pieceInfo: PieceInfo) => {
        rebuilding.add(pieceInfo.pieceName)
        try {
            await buildPieces(app, [pieceInfo])
        }
        finally {
            rebuilding.delete(pieceInfo.pieceName)
        }
        if (pendingRebuild.has(pieceInfo.pieceName)) {
            pendingRebuild.delete(pieceInfo.pieceName)
            void triggerBuild(pieceInfo)
        }
    }

    const watcher = chokidar.watch(watchPaths, { ignoreInitial: true })

    watcher.on('all', (_event, filePath) => {
        const pieceInfo = pieceInfos.find(p => filePath.startsWith(p.pieceDirectory))
        if (!pieceInfo) return

        clearTimeout(debounceTimers.get(pieceInfo.pieceName))
        debounceTimers.set(pieceInfo.pieceName, setTimeout(() => {
            debounceTimers.delete(pieceInfo.pieceName)
            if (rebuilding.has(pieceInfo.pieceName)) {
                pendingRebuild.add(pieceInfo.pieceName)
                return
            }
            void triggerBuild(pieceInfo)
        }, 300))
    })

    watcher.on('error', (error) => {
        app.log.error({ err: error }, 'File watcher error')
    })

    for (const pieceInfo of pieceInfos) {
        app.log.info(`Watching for changes: ${pieceInfo.pieceName}`)
    }

    const cleanup = async () => {
        await watcher.close()
        for (const timer of debounceTimers.values()) {
            clearTimeout(timer)
        }
    }
    process.once('SIGINT', () => void cleanup())
    process.once('SIGTERM', () => void cleanup())
}

function spawnAndWait(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: false,
        })
        child.on('close', (code) => {
            if (code === 0) {
                resolve()
            }
            else {
                reject(new Error(`Command "${cmd}" exited with code ${code}`))
            }
        })
        child.on('error', reject)
    })
}

async function copyPackageJsonToDist(sourceDir: string): Promise<void> {
    const distDir = join(sourceDir, 'dist')
    await copyFile(join(sourceDir, 'package.json'), join(distDir, 'package.json'))
}

async function copyI18nToDist(sourceDir: string): Promise<void> {
    const i18nSrc = join(sourceDir, 'src', 'i18n')
    const distDir = join(sourceDir, 'dist')
    try {
        await cp(i18nSrc, join(distDir, 'src', 'i18n'), { recursive: true })
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
}

type PieceInfo = {
    packageName: string
    pieceName: string
    pieceDirectory: string
}
