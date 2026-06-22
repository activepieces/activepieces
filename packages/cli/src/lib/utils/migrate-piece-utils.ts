import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function migratePiece({ piecePath, dryRun }: MigratePieceParams): MigrateReport {
    const repointedFiles: string[] = []
    const srcDir = join(piecePath, 'src')
    if (existsSync(srcDir)) {
        for (const file of collectTsFiles(srcDir)) {
            const original = readFileSync(file, 'utf-8')
            const rewritten = repointImports(original)
            if (rewritten !== original) {
                repointedFiles.push(file)
                if (!dryRun) {
                    writeFileSync(file, rewritten)
                }
            }
        }
    }
    const manifestChanged = migrateManifest({ piecePath, dryRun })
    const eslintChanged = migrateEslintConfig({ piecePath, dryRun })
    return { repointedFiles, manifestChanged, eslintChanged }
}

function collectTsFiles(dir: string): string[] {
    const files: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...collectTsFiles(full))
        }
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            files.push(full)
        }
    }
    return files
}

// A piece imports only from @activepieces/pieces-framework (which re-exports the foundation
// symbols). Repoint every shared / core-* import specifier to the framework; a symbol the
// framework does not re-export was server-only and will surface as a build error.
function repointImports(content: string): string {
    let next = content
    for (const moduleName of REPOINTED_MODULES) {
        next = next.split(`from '${moduleName}'`).join(`from '${FRAMEWORK}'`)
        next = next.split(`from "${moduleName}"`).join(`from "${FRAMEWORK}"`)
    }
    return next
}

function migrateManifest({ piecePath, dryRun }: MigratePieceParams): boolean {
    const manifestPath = join(piecePath, 'package.json')
    if (!existsSync(manifestPath)) {
        return false
    }
    const raw = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)
    const dependencies: Record<string, string> = manifest.dependencies ?? {}
    const devDependencies: Record<string, string> = manifest.devDependencies ?? {}
    const scripts: Record<string, string> = manifest.scripts ?? {}

    delete dependencies['@activepieces/shared']
    for (const dep of REQUIRED_DEPENDENCIES) {
        dependencies[dep] = dependencies[dep] ?? 'workspace:*'
    }
    if (dependencies['tslib']) {
        devDependencies['tslib'] = devDependencies['tslib'] ?? dependencies['tslib']
        delete dependencies['tslib']
    }
    devDependencies['tslib'] = devDependencies['tslib'] ?? TSLIB_VERSION
    scripts['bundle'] = scripts['bundle'] ?? BUNDLE_SCRIPT

    manifest.dependencies = dependencies
    manifest.devDependencies = devDependencies
    manifest.scripts = scripts

    const next = JSON.stringify(manifest, null, 2) + '\n'
    if (next === raw) {
        return false
    }
    if (!dryRun) {
        writeFileSync(manifestPath, next)
    }
    return true
}

function migrateEslintConfig({ piecePath, dryRun }: MigratePieceParams): boolean {
    const configPath = join(piecePath, '.eslintrc.json')
    const previous = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : ''
    const config = previous ? JSON.parse(previous.replace(/^﻿/, '')) : defaultEslintConfig()

    const overrides: EslintOverride[] = config.overrides ?? []
    let tsOverride = overrides.find((override) => Array.isArray(override.files) && override.files.includes('*.ts') && !override.files.includes('*.js'))
    if (!tsOverride) {
        tsOverride = { files: ['*.ts', '*.tsx'], rules: {} }
        overrides.push(tsOverride)
    }
    tsOverride.rules = tsOverride.rules ?? {}
    tsOverride.rules['no-restricted-imports'] = mergeImportBoundaryRule(tsOverride.rules['no-restricted-imports'])
    config.overrides = overrides

    const next = JSON.stringify(config, null, 2) + '\n'
    if (next === previous) {
        return false
    }
    if (!dryRun) {
        writeFileSync(configPath, next)
    }
    return true
}

function defaultEslintConfig(): Record<string, unknown> {
    return {
        extends: ['../../../../.eslintrc.json'],
        ignorePatterns: ['!**/*'],
        overrides: [
            { files: ['*.ts', '*.tsx', '*.js', '*.jsx'], rules: {} },
            { files: ['*.js', '*.jsx'], rules: {} },
        ],
    }
}

// Merge the required import-boundary patterns into any pre-existing no-restricted-imports rule
// instead of overwriting it, so a fork's own bans (patterns or paths) survive migration while the
// standard set is still guaranteed. String patterns are deduplicated; severity is set to 'error'.
function mergeImportBoundaryRule(existing: unknown): [string, RestrictedImportsOptions] {
    const { patterns, paths } = readRestrictedImports(existing)
    const seen = new Set(patterns.filter((pattern): pattern is string => typeof pattern === 'string'))
    const mergedPatterns = [...patterns]
    for (const pattern of IMPORT_BOUNDARY_PATTERNS) {
        if (!seen.has(pattern)) {
            mergedPatterns.push(pattern)
            seen.add(pattern)
        }
    }
    const options: RestrictedImportsOptions = { patterns: mergedPatterns }
    if (paths.length > 0) {
        options.paths = paths
    }
    return ['error', options]
}

function readRestrictedImports(rule: unknown): { patterns: unknown[], paths: unknown[] } {
    const patterns: unknown[] = []
    const paths: unknown[] = []
    if (!Array.isArray(rule)) {
        return { patterns, paths }
    }
    for (const entry of rule.slice(1)) {
        if (typeof entry === 'string') {
            paths.push(entry)
        }
        else if (isRecord(entry)) {
            const entryPatterns = entry['patterns']
            const entryPaths = entry['paths']
            if (Array.isArray(entryPatterns)) {
                patterns.push(...entryPatterns)
            }
            if (Array.isArray(entryPaths)) {
                paths.push(...entryPaths)
            }
        }
    }
    return { patterns, paths }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

const FRAMEWORK = '@activepieces/pieces-framework'
const REPOINTED_MODULES = [
    '@activepieces/shared',
    '@activepieces/core-utils',
    '@activepieces/core-piece-types',
    '@activepieces/core-formula',
    '@activepieces/core-execution',
]
const REQUIRED_DEPENDENCIES = [
    '@activepieces/pieces-common',
    '@activepieces/pieces-framework',
    '@activepieces/core-piece-types',
    '@activepieces/core-utils',
]
const IMPORT_BOUNDARY_PATTERNS = [
    'lodash',
    'lodash/*',
    '@activepieces/core-*',
    '@activepieces/server*',
    '@activepieces/engine',
    '@activepieces/shared',
]
const TSLIB_VERSION = '2.6.2'
const BUNDLE_SCRIPT = 'node ../../../../dist/packages/cli/src/index.js pieces bundle'

export const migratePieceUtils = { migratePiece }

export type MigratePieceParams = {
    piecePath: string
    dryRun: boolean
}
export type MigrateReport = {
    repointedFiles: string[]
    manifestChanged: boolean
    eslintChanged: boolean
}
type EslintOverride = {
    files: string[]
    rules?: Record<string, unknown>
}
type RestrictedImportsOptions = {
    patterns: unknown[]
    paths?: unknown[]
}
