import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { logger } from '../logger'

async function findAllPiecesFolder(folderPath: string): Promise<string[]> {
    const paths = []
    const files = await readdir(folderPath)

    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (
            fileStats.isDirectory() &&
            file !== 'node_modules' &&
            file !== 'dist' &&
            file !== 'framework' &&
            file !== 'common'
        ) {
            paths.push(...(await findAllPiecesFolder(filePath)))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

async function findDirectoryByPackageName(packageName: string) {
    const paths = await findAllPiecesFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
    for (const path of paths) {
        try {
            const packageJson = await readFile(join(path, 'package.json'), 'utf-8').then(JSON.parse)
            if (packageJson.name === packageName) {
                return path
            }
        } catch (e) {
            logger.error({
                name: 'findDirectoryByPackageName',
                message: JSON.stringify(e)
            }, 'Error finding directory by package name');
        }
    }
    return null
}
export const filePiecesUtils = {
    findAllPiecesFolder,
    findDirectoryByPackageName,

}