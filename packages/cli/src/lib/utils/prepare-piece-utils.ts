import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { buildWorkspaceVersionMap, resolveWorkspaceDependencies, stripSemverRanges } from './workspace-utils'

function copyPackageJson({ piecePath, distPath }: PieceDistPaths): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        return
    }
    copyFileSync(srcPackageJson, join(distPath, 'package.json'))
}

function copyI18nAssets({ piecePath, distPath }: PieceDistPaths): void {
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
}

function symlinkNodeModules({ piecePath, distPath }: PieceDistPaths): void {
    const srcNodeModules = resolve(piecePath, 'node_modules')
    const distNodeModules = join(distPath, 'node_modules')
    if (!existsSync(srcNodeModules) || existsSync(distNodeModules)) {
        return
    }
    symlinkSync(resolve(srcNodeModules), distNodeModules, 'dir')
}

function preparePieceDistForPublish(piecePath: string): void {
    const distPath = join(piecePath, 'dist')

    if (!existsSync(distPath)) {
        throw new Error(`[preparePiece] no dist output at ${distPath} for ${piecePath}`)
    }

    const paths = { piecePath, distPath }
    copyPackageJson(paths)
    copyI18nAssets(paths)
    symlinkNodeModules(paths)

    const workspaceVersionMap = buildWorkspaceVersionMap(cwd())

    const distPackageJsonPath = join(distPath, 'package.json')
    const json = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))

    json.dependencies = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies, workspaceVersionMap))
    json.devDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.devDependencies, workspaceVersionMap))
    json.peerDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.peerDependencies, workspaceVersionMap))

    writeFileSync(distPackageJsonPath, JSON.stringify(json, null, 2) + '\n')
    console.info(`[preparePiece] prepared ${piecePath} (${Object.keys(json.dependencies ?? {}).length} deps)`)
}

export { preparePieceDistForPublish }

type PieceDistPaths = {
    piecePath: string
    distPath: string
}
