import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

function getChangedPiecePaths(): string[] | null {
    const changedPieces = process.env['CHANGED_PIECES']
    if (!changedPieces || changedPieces.trim() === '') {
        return null
    }
    return changedPieces.split('\n').filter(Boolean)
}

function resolveWorkspaceVersion(packageName: string): string | null {
    for (const searchPath of WORKSPACE_SEARCH_PATHS) {
        const pkgPath = join(searchPath, 'package.json')
        if (!existsSync(pkgPath)) {
            continue
        }
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === packageName) {
            return pkg.version
        }
    }
    return null
}

function resolveWorkspaceVersions(dependencies: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {}
    for (const [name, version] of Object.entries(dependencies)) {
        if (version.startsWith('workspace:')) {
            const resolvedVersion = resolveWorkspaceVersion(name)
            resolved[name] = resolvedVersion ?? version
        } else {
            resolved[name] = version
        }
    }
    return resolved
}

function copyPieceAssets(piecePath: string): boolean {
    const distPath = join('dist', piecePath)

    if (!existsSync(distPath)) {
        console.info(`[copyPieceAssets] no dist output at ${distPath}, skipping ${piecePath}`)
        return false
    }

    copyPackageJson(piecePath, distPath)
    copyI18nAssets(piecePath, distPath)
    return true
}

function copyPackageJson(piecePath: string, distPath: string): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        return
    }
    const pkg = JSON.parse(readFileSync(srcPackageJson, 'utf-8'))
    if (pkg.dependencies) {
        pkg.dependencies = resolveWorkspaceVersions(pkg.dependencies)
    }
    writeFileSync(join(distPath, 'package.json'), JSON.stringify(pkg, null, 2))
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

const WORKSPACE_SEARCH_PATHS = [
    'packages/shared',
    'packages/pieces/community/common',
    'packages/pieces/community/framework',
]
