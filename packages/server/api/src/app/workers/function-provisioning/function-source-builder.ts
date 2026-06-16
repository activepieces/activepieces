import { execFile } from 'node:child_process'
import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

const execFileAsync = promisify(execFile)

async function pathExists(target: string): Promise<boolean> {
    try {
        await access(target)
        return true
    }
    catch {
        return false
    }
}

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

// Bake each piece as a hoisted, real-file npm install under
// `engine-cache/pieces/<alias>/node_modules/`. bun's worker cache uses symlinks into a shared
// store, which gcloud's source upload strips — so a fresh `npm install` (real files, no symlinks)
// is what survives the upload and lets the engine resolve the piece + its transitive deps at
// `<AP_CUSTOM_PIECES_PATHS>/pieces/<alias>/node_modules/<realName>/src/index.js`.
async function bakePieces(stagingDir: string, pieces: PieceArtifact[], log: FastifyBaseLogger): Promise<string[]> {
    if (pieces.length === 0) {
        return []
    }
    const baked: string[] = []
    for (const piece of pieces) {
        const dir = path.join(stagingDir, 'engine-cache', 'pieces', piece.alias)
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'package.json'), JSON.stringify({
            name: 'ap-baked-piece',
            version: '1.0.0',
            dependencies: { [piece.pieceName]: piece.pieceVersion },
        }, null, 2))
        await execFileAsync('npm', ['install', '--install-links', '--no-audit', '--no-fund', '--prefix', dir], {
            timeout: 300_000,
            maxBuffer: 50 * 1024 * 1024,
        })
        if (await pathExists(path.join(dir, 'node_modules', piece.pieceName, 'src', 'index.js'))) {
            baked.push(piece.alias)
        }
        else {
            log.warn({ alias: piece.alias }, '[functionSourceBuilder] piece missing src/index.js after npm install')
        }
    }
    return baked
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
