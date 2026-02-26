import { access, copyFile, cp } from 'node:fs/promises'
import { join, resolve } from 'path'
import { ApLock, filePiecesUtils, memoryLock, spawnWithKill } from '@activepieces/server-common'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import { FSWatcher, watch } from 'chokidar'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { devPiecesState } from './dev-pieces-state'

export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function buildPieces(piecesInfo: PieceInfo[], io: Server, log: FastifyBaseLogger): Promise<void> {
    if (piecesInfo.length === 0) return

    for (const piece of piecesInfo) {
        if (!/^[A-Za-z0-9-]+$/.test(piece.pieceName)) {
            throw new Error(`Piece package name contains invalid character: ${piece.pieceName}`)
        }
    }

    const pieceFilters = piecesInfo.map(p => `--filter=@activepieces/piece-${p.pieceName}`).join(' ')
    const sharedFilters = '--filter=@activepieces/pieces-framework --filter=@activepieces/pieces-common --filter=@activepieces/shared'
    const filterArgs = `${sharedFilters} ${pieceFilters} --force`
    log.info(chalk.blue.bold(`🤌 Building ${piecesInfo.length} piece(s): ${piecesInfo.map(p => p.pieceName).join(',')}... 🤌`))

    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        const startTime = performance.now()
        await spawnWithKill({ cmd: `npx turbo run build ${filterArgs}`, printOutput: true })
        const endTime = performance.now()
        const buildTime = (endTime - startTime) / 1000

        log.info(chalk.blue.bold(`Build completed in ${buildTime.toFixed(2)} seconds`))

        for (const piece of piecesInfo) {
            await copyPackageJsonToDist(piece.pieceDirectory)
            await copyI18nToDist(piece.pieceDirectory)
            const distPath = await filePiecesUtils(log).findDistPiecePathByPackageName(piece.packageName)
            if (distPath) {
                filePiecesUtils(log).clearPieceModuleCache(distPath)
            }
        }

        devPiecesState.incrementGeneration()
        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        log.info(error, chalk.red.bold('Failed to run build process...'))
    }
    finally {
        if (lock) {
            await lock.release()
        }
        log.info(
            chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨',
            ),
        )
    }
}

export async function devPiecesBuilder(app: FastifyInstance, io: Server, piecesNames: string[]): Promise<void> {
    const watchers: FSWatcher[] = []

    const resolvedInfos = await Promise.all(piecesNames.map(async (pieceName) => {
        const pieceDirectory = await filePiecesUtils(app.log).findSourcePiecePathByPieceName(pieceName)
        if (isNil(pieceDirectory)) {
            app.log.info(chalk.yellow(`Piece directory not found for package: ${pieceName}`))
            return null
        }
        const packageName = await filePiecesUtils(app.log).getPackageNameFromFolderPath(pieceDirectory)
        return { pieceName, pieceDirectory, packageName }
    }))
    const pieceInfos: PieceInfo[] = resolvedInfos.filter((info) => info !== null)

    await buildPieces(pieceInfos, io, app.log)

    for (const pieceInfo of pieceInfos) {
        app.log.info(chalk.blue(`Starting watch for package: ${pieceInfo.packageName}`))
        app.log.info(chalk.yellow(`Found piece directory: ${pieceInfo.pieceDirectory}`))

        const debouncedBuild = debounce((): void => {
            void (async (): Promise<void> => {
                try {
                    await buildPieces([pieceInfo], io, app.log)
                }
                catch (error) {
                    app.log.error(error)
                }
            })()
        }, 2000)

        const watcher = watch(resolve(pieceInfo.pieceDirectory), {
            ignored: [/^\./, /node_modules/, /dist/],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 200,
            },
        })
        watcher.on('all', (_event, path) => {
            if (path.endsWith('.ts') || path.endsWith('package.json')) {
                debouncedBuild()
            }
        })

        watchers.push(watcher)
    }

    app.addHook('onClose', async () => {
        await Promise.all(watchers.map(watcher => watcher.close().catch(app.log.error)))
    })
}

async function copyPackageJsonToDist(sourceDir: string): Promise<void> {
    const distDir = getDistDir(sourceDir)
    await copyFile(join(sourceDir, 'package.json'), join(distDir, 'package.json'))
}

async function copyI18nToDist(sourceDir: string): Promise<void> {
    const i18nSrc = join(sourceDir, 'src', 'i18n')
    const exists = await access(i18nSrc).then(() => true).catch(() => false)
    if (!exists) {
        return
    }
    const distDir = getDistDir(sourceDir)
    const i18nDest = join(distDir, 'src', 'i18n')
    await cp(i18nSrc, i18nDest, { recursive: true })
}

function getDistDir(sourceDir: string): string {
    return join(sourceDir, 'dist')
}

type PieceInfo = {
    packageName: string
    pieceName: string
    pieceDirectory: string
}
