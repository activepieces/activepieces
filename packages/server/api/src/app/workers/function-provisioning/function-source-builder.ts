import { existsSync, readdirSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

// Assembles the per-project Cloud Functions gen2 source directory: the engine's
// functions-framework entry (copied from the base gen2 bundle) plus the project's baked
// artifacts in the exact layout the engine reads — `codes/<flowVersionId>/<stepName>/index.js`
// for code steps and a bun/npm workspace under `pieces/<name>-<version>/` for pieces. gen2's
// buildpack installs those workspace deps at build time, so the deployed function has everything
// baked in and pulls nothing at run time (ADR-0002 §7). Rebuilt on publish.
export const functionSourceBuilder = {
    async build({ projectId, baseSourceDir, flowVersions, log }: BuildParams): Promise<string> {
        const stagingDir = path.join(tmpdir(), 'ap-engine-source', projectId)
        await rm(stagingDir, { recursive: true, force: true })
        await mkdir(stagingDir, { recursive: true })

        // Start from the generic gen2 entry (index.js + package.json with functions-framework).
        await cp(baseSourceDir, stagingDir, { recursive: true })

        const artifacts = collectArtifacts(flowVersions)
        await bakeCodeSteps(stagingDir, artifacts.codeSteps)
        const bakedPieces = await bakePieces(stagingDir, artifacts.pieces, log)
        // gcloud auto-generates a .gcloudignore that strips node_modules (so the buildpack
        // reinstalls). Our baked piece tree (bun store + symlinks) must survive upload, so write
        // our own that keeps it.
        await writeFile(path.join(stagingDir, '.gcloudignore'), '.git\nnode_modules/.cache\n')

        log.info({
            projectId,
            stagingDir,
            codeSteps: artifacts.codeSteps.length,
            pieces: artifacts.pieces.length,
            bakedPieces,
        }, '[functionSourceBuilder] assembled per-project gen2 source')
        return stagingDir
    },
}

function collectArtifacts(flowVersions: FlowVersion[]): ProjectArtifacts {
    const codeSteps: CodeArtifact[] = []
    const pieceMap = new Map<string, PieceArtifact>()
    for (const flowVersion of flowVersions) {
        for (const step of flowStructureUtil.getAllSteps(flowVersion.trigger)) {
            if (step.type === FlowActionType.CODE) {
                codeSteps.push({
                    flowVersionId: flowVersion.id,
                    stepName: step.name,
                    code: step.settings.sourceCode.code,
                    packageJson: step.settings.sourceCode.packageJson,
                })
            }
            if (step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE) {
                const { pieceName, pieceVersion } = step.settings
                const alias = `${pieceName}-${pieceVersion}`
                if (!pieceMap.has(alias)) {
                    pieceMap.set(alias, { pieceName, pieceVersion, alias })
                }
            }
        }
    }
    return { codeSteps, pieces: [...pieceMap.values()] }
}

async function bakeCodeSteps(stagingDir: string, codeSteps: CodeArtifact[]): Promise<void> {
    for (const codeStep of codeSteps) {
        const dir = path.join(stagingDir, 'codes', codeStep.flowVersionId, codeStep.stepName)
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'index.js'), codeStep.code)
        await writeFile(path.join(dir, 'package.json'), codeStep.packageJson)
    }
}

// Transplant the worker's prepared piece cache into the source under `engine-cache/`. Pieces are
// installed by bun as `pieces/<alias>/node_modules/<realName>` symlinks into a shared
// `node_modules/.bun` store (relative links). We copy BOTH `pieces/` and `node_modules/`
// preserving symlinks so those relative links still resolve inside the image, then point
// AP_CUSTOM_PIECES_PATHS at `engine-cache` — the engine resolves a piece at
// `<customPath>/pieces/<alias>/node_modules/<realName>/src/index.js`.
async function bakePieces(stagingDir: string, pieces: PieceArtifact[], log: FastifyBaseLogger): Promise<string[]> {
    if (pieces.length === 0) {
        return []
    }
    const cacheCommon = findCacheCommonRoot()
    if (isNilString(cacheCommon)) {
        throw new Error('Cannot bake pieces: prepared cache (cache/<version>/common) not found on disk')
    }
    const engineCache = path.join(stagingDir, 'engine-cache')
    await mkdir(engineCache, { recursive: true })
    // verbatim (symlinks preserved) so bun's relative store links keep resolving inside engine-cache
    await cp(path.join(cacheCommon, 'pieces'), path.join(engineCache, 'pieces'), { recursive: true, verbatimSymlinks: true })
    await cp(path.join(cacheCommon, 'node_modules'), path.join(engineCache, 'node_modules'), { recursive: true, verbatimSymlinks: true })

    const baked = pieces
        .filter((piece) => existsSync(path.join(engineCache, 'pieces', piece.alias, 'node_modules', piece.pieceName, 'src', 'index.js')))
        .map((piece) => piece.alias)
    const missing = pieces.filter((piece) => !baked.includes(piece.alias)).map((piece) => piece.alias)
    if (missing.length > 0) {
        log.warn({ missing }, '[functionSourceBuilder] some pieces missing src/index.js after copy')
    }
    return baked
}

// The prepared cache lives at <repo>/cache/<version>/common (UNSANDBOXED layout). Pick the newest
// version dir that has both a pieces/ and node_modules/ folder.
function findCacheCommonRoot(): string | null {
    const cacheRoot = path.resolve('cache')
    if (!existsSync(cacheRoot)) {
        return null
    }
    const candidates = readdirSync(cacheRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(cacheRoot, entry.name, 'common'))
        .filter((common) => existsSync(path.join(common, 'pieces')) && existsSync(path.join(common, 'node_modules')))
        .sort()
    return candidates.length > 0 ? candidates[candidates.length - 1] : null
}

function isNilString(value: string | null): value is null {
    return value === null
}

type CodeArtifact = {
    flowVersionId: string
    stepName: string
    code: string
    packageJson: string
}

type PieceArtifact = {
    pieceName: string
    pieceVersion: string
    alias: string
}

type ProjectArtifacts = {
    codeSteps: CodeArtifact[]
    pieces: PieceArtifact[]
}

type BuildParams = {
    projectId: string
    baseSourceDir: string
    flowVersions: FlowVersion[]
    log: FastifyBaseLogger
}
