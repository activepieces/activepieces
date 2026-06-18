import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { buildWorkspaceVersionMap, resolveWorkspaceDependencies, stripSemverRanges } from './workspace-utils'
import { bundlePieceUtils } from './bundle-piece-utils'

function copyPackageJson({ piecePath, distPath }: PieceDistPaths): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        throw new Error(`[preparePiece] no package.json at ${srcPackageJson}`)
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

async function preparePieceDistForPublish(piecePath: string): Promise<void> {
    const distPath = join(piecePath, 'dist')

    if (!existsSync(distPath)) {
        throw new Error(`[preparePiece] no dist output at ${distPath} for ${piecePath}`)
    }

    const paths = { piecePath, distPath }
    copyPackageJson(paths)
    copyI18nAssets(paths)

    const { bundleBytes, rawBytes, external } = await bundlePieceUtils.bundlePiece(paths)

    rewriteManifestForBundle({ distPath, external })

    const ratio = rawBytes > 0 ? (rawBytes / bundleBytes).toFixed(1) : '—'
    const extNote = external.length ? ` external=[${external.join(', ')}]` : ''
    console.info(`[preparePiece] bundled ${piecePath} → ${(bundleBytes / 1024).toFixed(0)} KB (${ratio}x smaller than ${(rawBytes / 1024).toFixed(0)} KB raw inputs)${extNote}`)
}

// The published artifact is the self-contained bundle. framework/common/shared and
// all pure-JS deps are inlined; only native externals remain as install-time deps.
function rewriteManifestForBundle({ distPath, external }: { distPath: string, external: string[] }): void {
    const distPackageJsonPath = join(distPath, 'package.json')
    const json = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))

    const workspaceVersionMap = buildWorkspaceVersionMap(cwd())
    const resolvedDeps = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies ?? {}, workspaceVersionMap))

    const nativeDeps: Record<string, string> = {}
    for (const dep of external) {
        if (resolvedDeps[dep]) {
            nativeDeps[dep] = resolvedDeps[dep]
        }
    }

    json.main = `./${bundlePieceUtils.BUNDLE_FILENAME}`
    json.dependencies = nativeDeps
    delete json.devDependencies
    delete json.peerDependencies
    delete json.scripts
    delete json.types
    json.files = [bundlePieceUtils.BUNDLE_FILENAME, 'package.json', 'src/i18n']

    writeFileSync(distPackageJsonPath, JSON.stringify(json, null, 2) + '\n')
}

export { preparePieceDistForPublish }

type PieceDistPaths = {
    piecePath: string
    distPath: string
}
