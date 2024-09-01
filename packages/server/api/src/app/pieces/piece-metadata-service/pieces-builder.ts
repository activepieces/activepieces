import { spawn } from 'child_process'
import { Server } from 'http'
import { resolve } from 'path'
import { AppSystemProp, filePiecesUtils, logger, SharedSystemProp, system } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, debounce, WebsocketClientEvent } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import chalk from 'chalk'
import chokidar from 'chokidar'

const mutex = new Mutex()
const packages = system.get(AppSystemProp.DEV_PIECES)?.split(',') || []
const isFilePieces = system.getOrThrow(SharedSystemProp.PIECES_SOURCE) === 'FILE'

async function handleFileChange(piecePackageName: string, io: Server): Promise<void> {
    logger.info(
        chalk.blueBright.bold(
            '👀 Detected changes in pieces. Waiting... 👀 ' + piecePackageName,
        ),
    )
    try {
        await mutex.acquire()

        logger.info(chalk.blue.bold('🤌 Building pieces... 🤌'))
        const cmd = `nx run-many -t build --projects=${piecePackageName}`
        await runCommandWithLiveOutput(cmd)
        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    } 
    catch (error) {
        logger.info(chalk.red.bold('Failed to run build process...'), error)
    } 
    finally {
        mutex.release()
        logger.info(
            chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨',
            ),
        )
    }
}

async function runCommandWithLiveOutput(cmd: string): Promise<void> {
    const [command, ...args] = cmd.split(' ')

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' })

        child.on('error', reject)
        child.on('close', code => {
            if (code === 0) {
                resolve()
            }
            else {
                reject(new Error(`Process exited with code ${code}`))
            }
        })
    })
}

export async function piecesBuilder(io: Server): Promise<void> {
    // Only run this script if the pieces source is file
    if (!isFilePieces) return

    for (const packageName of packages) {
        logger.info(chalk.blue(`Starting watch for package: ${packageName}`))

        const pieceDirectory = await filePiecesUtils.findPieceDirectoryByFolderName(packageName)
        assertNotNullOrUndefined(pieceDirectory, 'pieceDirectory')
        logger.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const piecePackageName = `pieces-${packageName}`
        const debouncedHandleFileChange = debounce(() => {
            handleFileChange(piecePackageName, io).catch(logger.error)
        }, 2000)

        chokidar.watch(resolve(pieceDirectory), { ignored: /^\./, persistent: true }).on('all', (event, path) => {
            if (path.endsWith('.ts')) {
                debouncedHandleFileChange()
            }
        })
        
    }
}