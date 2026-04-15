import { existsSync, readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { apId } from '@activepieces/shared'
import { embedMany } from 'ai'
import fg from 'fast-glob'
import { FastifyBaseLogger } from 'fastify'
import simpleGit from 'simple-git'
import { databaseConnection } from '../database/database-connection'
import { copilotMdParser } from './copilot-md-parser'
import { copilotTsParser } from './copilot-ts-parser'
import { createCopilotEmbeddingModel } from './create-embedding-model'

const EMBED_BATCH_SIZE = 50
const REPO_URL = 'https://github.com/activepieces/activepieces.git'

const USE_LOCAL_REPO = false
const SERVER_ONLY = true

const IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/test/**',
    '**/pieces/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts',
    '**/.env*',
    '**/*.pem',
    '**/*.key',
    '**/*.cert',
    '**/*.p12',
    '**/secrets/**',
    '**/credentials/**',
    '**/.git/**',
    '**/docker-compose*.yml',
    '**/*.secret*',
    '**/.claude/**',
]

const indexingInProgress = new Set<string>()

export const platformCopilotIndexer = (log: FastifyBaseLogger) => ({
    async indexAll(): Promise<void> {
        if (indexingInProgress.has('global')) {
            log.info('[copilot-index] already running, skip')
            return
        }
        indexingInProgress.add('global')
        const start = Date.now()

        let repoDir: string
        let tmpDir: string | null = null

        try {
            if (USE_LOCAL_REPO) {
                repoDir = resolveRepoRoot()
                log.info({ repoDir }, '[copilot-index] using local repo')
            }
            else {
                tmpDir = `/tmp/ap-copilot-${apId()}`
                log.info('[copilot-index] cloning')
                await simpleGit().clone(REPO_URL, tmpDir, ['--depth', '1', '--single-branch', '--branch', 'main'])
                repoDir = tmpDir
            }

            const tsPattern = SERVER_ONLY ? 'packages/server/**/src/**/*.{ts,tsx}' : 'packages/**/src/**/*.{ts,tsx}'
            const tsPaths = await fg(tsPattern, { cwd: repoDir, ignore: IGNORE_PATTERNS })
            const mdPaths = await fg(['docs/**/*.{md,mdx}', '**/README.md'], { cwd: repoDir, ignore: IGNORE_PATTERNS })
            const jsonPaths = await fg('package.json', { cwd: repoDir })

            const allPaths = [...tsPaths, ...mdPaths, ...jsonPaths]
            log.info(`[copilot-index] found ${tsPaths.length} ts, ${mdPaths.length} md, ${jsonPaths.length} json = ${allPaths.length} total`)

            log.info('[copilot-index] parsing files...')
            const allFileChunks: FileWithChunks[] = []
            for (const relativePath of allPaths) {
                try {
                    const content = await fs.readFile(path.join(repoDir, relativePath), 'utf-8')
                    if (content.trim().length < 50) continue
                    const chunks = await extractChunks({ content, relativePath })
                    if (chunks.length === 0) continue
                    allFileChunks.push({ relativePath, language: detectLanguage(relativePath), chunks })
                }
                catch (err) {
                    log.warn(`[copilot-index] parse error: ${relativePath}: ${err instanceof Error ? err.message : String(err)}`)
                }
            }

            const totalChunks = allFileChunks.reduce((sum, f) => sum + f.chunks.length, 0)
            log.info(`[copilot-index] parsed ${allFileChunks.length} files → ${totalChunks} chunks`)

            const { model, modelId, providerOptions } = createCopilotEmbeddingModel()
            let storedChunks = 0

            for (const file of allFileChunks) {
                try {
                    await databaseConnection().query(
                        'DELETE FROM copilot_code_chunks WHERE "path" = $1',
                        [file.relativePath],
                    )

                    for (let i = 0; i < file.chunks.length; i += EMBED_BATCH_SIZE) {
                        const batch = file.chunks.slice(i, i + EMBED_BATCH_SIZE)
                        const { embeddings } = await embedMany({
                            model,
                            values: batch.map(c => c.content),
                            providerOptions,
                        })
                        await insertChunksBatch({ batch, embeddings, path: file.relativePath, language: file.language, modelId })
                        storedChunks += batch.length
                    }
                }
                catch (err) {
                    log.warn(`[copilot-index] embed/store error: ${file.relativePath}: ${err instanceof Error ? err.message : String(err)}`)
                }

                if (storedChunks % 200 < EMBED_BATCH_SIZE) {
                    log.info(`[copilot-index] stored ${storedChunks}/${totalChunks} chunks`)
                }
            }

            await databaseConnection().query(
                'UPDATE copilot_code_chunks SET "searchVector" = to_tsvector(\'english\', "content" || \' \' || COALESCE("summary", \'\')) WHERE "searchVector" IS NULL',
            )

            const indexedPaths = allFileChunks.map(f => f.relativePath)
            if (indexedPaths.length > 0) {
                const ph = indexedPaths.map((_, i) => `$${i + 1}`).join(',')
                await databaseConnection().query(`DELETE FROM copilot_code_chunks WHERE "path" NOT IN (${ph})`, indexedPaths)
            }

            log.info(`[copilot-index] done: ${allFileChunks.length} files, ${storedChunks} chunks in ${Math.round((Date.now() - start) / 1000)}s`)
        }
        finally {
            indexingInProgress.delete('global')
            if (tmpDir) {
                await fs.rm(tmpDir, { recursive: true, force: true })
            }
        }
    },

    async reindex(): Promise<void> {
        await platformCopilotIndexer(log).indexAll()
    },

    async clearIndex(): Promise<void> {
        await databaseConnection().query('DELETE FROM copilot_code_chunks')
    },

    async hasChunks(): Promise<boolean> {
        const result: [{ count: string }] = await databaseConnection().query('SELECT COUNT(*) AS count FROM copilot_code_chunks')
        return parseInt(result[0]?.count ?? '0', 10) > 0
    },
})

function resolveRepoRoot(): string {
    let dir = __dirname
    for (let i = 0; i < 20; i++) {
        const pkgPath = path.join(dir, 'package.json')
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name?: string }
                if (pkg.name === 'activepieces') return dir
            }
            catch { /* parse failed, go up */ }
        }
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
    }
    return process.cwd()
}

async function extractChunks({ content, relativePath }: ExtractChunksParams): Promise<ParsedChunk[]> {
    const ext = path.extname(relativePath).toLowerCase()
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        try {
            return await copilotTsParser.extractChunks({ content, filePath: relativePath })
        }
        catch {
            return fallbackChunks(content)
        }
    }
    if (ext === '.md' || ext === '.mdx') {
        return copilotMdParser.extractChunks({ content, filePath: relativePath })
    }
    if (ext === '.json') {
        return [{ content: buildPackageSummary(content), startLine: 1, endLine: content.split('\n').length, functionName: null, className: null, chunkType: 'module' }]
    }
    return []
}

function fallbackChunks(content: string): ParsedChunk[] {
    const lines = content.split('\n')
    const result: ParsedChunk[] = []
    for (let i = 0; i < lines.length; i += 80) {
        const text = lines.slice(i, i + 80).join('\n')
        if (text.trim().length > 20) {
            result.push({ content: text, startLine: i + 1, endLine: Math.min(i + 80, lines.length), functionName: null, className: null, chunkType: 'block' })
        }
    }
    return result
}

async function insertChunksBatch({ batch, embeddings, path: filePath, language, modelId }: InsertChunksBatchParams): Promise<void> {
    if (batch.length === 0) return
    const placeholders = batch.map((_, idx) => {
        const b = idx * 14
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12}::vector,$${b + 13},$${b + 14})`
    }).join(',')

    const values = batch.flatMap((c, j) => [
        apId(), new Date().toISOString(), new Date().toISOString(), filePath, language, c.content,
        c.startLine, c.endLine, c.functionName, c.className, c.chunkType,
        `[${embeddings[j].join(',')}]`, modelId, Math.ceil(c.content.length / 4),
    ])

    await databaseConnection().query(
        `INSERT INTO copilot_code_chunks ("id","created","updated","path","language","content","startLine","endLine","functionName","className","chunkType","embedding","embeddingModel","tokens")
         VALUES ${placeholders} ON CONFLICT DO NOTHING`,
        values,
    )
}

function buildPackageSummary(raw: string): string {
    try {
        const pkg = JSON.parse(raw) as PackageJson
        const deps = Object.keys(pkg.dependencies ?? {}).join(', ')
        const devDeps = Object.keys(pkg.devDependencies ?? {}).join(', ')
        const lines = [`Package: ${pkg.name ?? 'unknown'}@${pkg.version ?? 'unknown'}`]
        if (deps) lines.push(`Dependencies: ${deps}`)
        if (devDeps) lines.push(`DevDependencies: ${devDeps}`)
        return lines.join('\n')
    }
    catch {
        return raw
    }
}

function detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase()
    const map: Record<string, string> = { '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'javascript', '.md': 'markdown', '.mdx': 'markdown', '.json': 'json' }
    return map[ext] ?? null
}

type FileWithChunks = { relativePath: string, language: string | null, chunks: ParsedChunk[] }
type ParsedChunk = { content: string, startLine: number, endLine: number, functionName: string | null, className: string | null, chunkType: string }
type ExtractChunksParams = { content: string, relativePath: string }
type InsertChunksBatchParams = { batch: ParsedChunk[], embeddings: number[][], path: string, language: string | null, modelId: string }
type PackageJson = { name?: string, version?: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
