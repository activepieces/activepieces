import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { existsSync, mkdirSync, readdirSync, copyFileSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

function getChangedPiecePaths(): string[] | null {
    const changedPieces = process.env['CHANGED_PIECES']
    if (!changedPieces || changedPieces.trim() === '') {
        return null
    }
    return changedPieces.split('\n').filter(Boolean)
}

function copyPieceAssets(piecePath: string): boolean {
    const distPath = join('dist', piecePath)

    if (!existsSync(distPath)) {
        console.info(`[copyPieceAssets] no dist output at ${distPath}, skipping ${piecePath}`)
        return false
    }

    copyPackageJson(piecePath, distPath)
    copyI18nAssets(piecePath, distPath)
    symlinkNodeModules(piecePath, distPath)
    return true
}

function copyPackageJson(piecePath: string, distPath: string): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        return
    }
    copyFileSync(srcPackageJson, join(distPath, 'package.json'))
    console.info(`[copyPieceAssets] copied package.json for ${piecePath}`)
}

function copyI18nAssets(piecePath: string, distPath: string): void {
    const i18nSrc = join(piecePath, 'src', 'i18n')
    if (!existsSync(i18nSrc)) {
        return
    }

    const i18nDest = join(distPath, 'src', 'i18n')
    mkdirSync(i18nDest, { recursive: true })

    const files = readdirSync(i18nSrc)
    for (const file of files) {
        copyFileSync(join(i18nSrc, file), join(i18nDest, file))
    }

    console.info(`[copyPieceAssets] copied ${files.length} i18n files for ${piecePath}`)
}

function symlinkNodeModules(piecePath: string, distPath: string): void {
    const srcNodeModules = resolve(piecePath, 'node_modules')
    const distNodeModules = join(distPath, 'node_modules')
    if (!existsSync(srcNodeModules) || existsSync(distNodeModules)) {
        return
    }
    symlinkSync(resolve(srcNodeModules), distNodeModules, 'dir')
    console.info(`[copyPieceAssets] symlinked node_modules for ${piecePath}`)
}

const main = async () => {
    const changedPaths = getChangedPiecePaths()
    const piecePaths = changedPaths ?? await findAllPiecesDirectoryInSource()

    console.info(`[copyPieceAssets] processing ${piecePaths.length} pieces${changedPaths ? ' (scoped to changed)' : ' (all)'}`)

    let copiedCount = 0
    for (const piecePath of piecePaths) {
        if (copyPieceAssets(piecePath)) {
            copiedCount++
        }
    }

    console.info(`[copyPieceAssets] done, copied assets for ${copiedCount} pieces`)
}

main()
