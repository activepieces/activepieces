import fs from 'fs/promises'
import path from 'path'
import { isNil } from '@activepieces/core-utils'
import { EngineGenericError, getPackageAliasForPiece, getPieceNameFromAlias, trimVersionFromAlias } from '@activepieces/shared'
import { utils } from '../../utils'
import { PieceRef } from './piece-runner'

export const piecePath = {
    resolve: async ({ pieceName, pieceVersion, devPieces }: PieceRef): Promise<string> => {
        const packageName = getPackageAlias({ pieceName, pieceVersion, devPieces })
        const piecePath = devPieces.includes(getPieceNameFromAlias(packageName))
            ? await findInDistFolder(packageName)
            : await traverseAllParentFoldersToFindPiece(packageName)
        if (isNil(piecePath)) {
            throw new EngineGenericError('PieceNotFoundError', `Piece not found for package: ${packageName}`)
        }
        return piecePath
    },

}

function getPackageAlias({ pieceName, pieceVersion, devPieces }: PieceRef): string {
    if (devPieces.includes(getPieceNameFromAlias(pieceName))) {
        return pieceName
    }

    return getPackageAliasForPiece({
        pieceName,
        pieceVersion,
    })
}

async function findInDistFolder(packageName: string): Promise<string | null> {
    const sourcePiecesPath = path.resolve('packages/pieces')
    if (!await utils.folderExists(sourcePiecesPath)) {
        return null
    }
    const distPackageJsonPaths = await findDistPackageJsonFiles(sourcePiecesPath)
    for (const packageJsonPath of distPackageJsonPaths) {
        const { data: result } = await utils.tryCatchAndThrowOnEngineError(async () => {
            const content = await fs.readFile(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(content)
            if (packageJson.name === packageName) {
                return path.join(path.dirname(packageJsonPath), 'src', 'index.js')
            }
            return null
        })
        if (result) {
            return result
        }
    }
    return null
}

async function findDistPackageJsonFiles(dirPath: string): Promise<string[]> {
    const results: string[] = []
    const ignoredDirs = ['node_modules', '.turbo', 'framework', 'common']

    async function scanDir(currentPath: string): Promise<void> {
        const items = await fs.readdir(currentPath, { withFileTypes: true })
        for (const item of items) {
            if (!item.isDirectory() || ignoredDirs.includes(item.name)) {
                continue
            }
            const fullPath = path.join(currentPath, item.name)
            if (item.name === 'dist') {
                const pkgJson = path.join(fullPath, 'package.json')
                if (await utils.folderExists(pkgJson)) {
                    results.push(pkgJson)
                }
            }
            else {
                await scanDir(fullPath)
            }
        }
    }

    await scanDir(dirPath)
    return results
}


async function traverseAllParentFoldersToFindPiece(packageName: string): Promise<string | null> {
    const trimmedName = trimVersionFromAlias(packageName)
    const customPaths = (process.env.AP_CUSTOM_PIECES_PATHS ?? '').split(':').filter(Boolean)
    for (const customPath of customPaths) {
        const entry = await resolveInstalledPieceEntry(path.resolve(customPath, 'pieces', packageName), trimmedName)
        if (!isNil(entry)) {
            return entry
        }
    }

    const rootDir = path.parse(__dirname).root
    let currentDir = __dirname
    const maxIterations = currentDir.split(path.sep).length
    for (let i = 0; i < maxIterations; i++) {
        const entry = await resolveInstalledPieceEntry(path.resolve(currentDir, 'pieces', packageName), trimmedName)
        if (!isNil(entry)) {
            return entry
        }

        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir || currentDir === rootDir) {
            break
        }
        currentDir = parentDir
    }
    return null
}

// A piece entry is resolved from its package.json "main" (defaulting to src/index.js).
// Registry/dev installs keep the package nested in node_modules; a packed-archive bundle is
// extracted straight to the install-folder root. Try the nested package first, then the root.
async function resolveInstalledPieceEntry(pieceFolder: string, trimmedName: string): Promise<string | null> {
    const packageDir = path.join(pieceFolder, 'node_modules', trimmedName)
    if (await utils.folderExists(packageDir)) {
        return resolveEntryFromPackageDir(packageDir)
    }
    // Only return an entry that actually exists: a half-installed registry folder also has a
    // stub package.json (no "main") at this point, for which resolveEntryFromPackageDir would
    // otherwise return a non-existent src/index.js — fall through to a clean PieceNotFoundError.
    const rootManifest = path.join(pieceFolder, 'package.json')
    if (await utils.folderExists(rootManifest)) {
        const rootEntry = await resolveEntryFromPackageDir(pieceFolder)
        if (await utils.folderExists(rootEntry)) {
            return rootEntry
        }
    }
    return null
}

async function resolveEntryFromPackageDir(packageDir: string): Promise<string> {
    const { data: mainEntry } = await utils.tryCatchAndThrowOnEngineError(async () => {
        const packageJson = JSON.parse(await fs.readFile(path.join(packageDir, 'package.json'), 'utf-8'))
        if (isNil(packageJson.main)) {
            return null
        }
        const resolved = path.join(packageDir, packageJson.main)
        return await utils.folderExists(resolved) ? resolved : null
    })
    return mainEntry ?? path.join(packageDir, 'src', 'index.js')
}
