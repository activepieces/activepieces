import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findInstalledVersion, rewriteManifestForBundle } from './prepare-piece-utils'

describe('findInstalledVersion', () => {
    let root: string | undefined

    afterEach(() => {
        if (root) {
            rmSync(root, { recursive: true, force: true })
            root = undefined
        }
    })

    function writePackage(nodeModulesDir: string, name: string, version: string): void {
        const dir = join(nodeModulesDir, ...name.split('/'))
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version }))
    }

    it('finds a dependency nested under a scoped package', () => {
        root = mkdtempSync(join(tmpdir(), 'ap-find-'))
        const nodeModulesDir = join(root, 'node_modules')
        writePackage(join(nodeModulesDir, '@scope', 'host', 'node_modules'), 'target-dep', '9.9.9')

        expect(findInstalledVersion({ nodeModulesDir, dep: 'target-dep' })).toBe('9.9.9')
    })

    it('finds a dependency nested under an unscoped package', () => {
        root = mkdtempSync(join(tmpdir(), 'ap-find-'))
        const nodeModulesDir = join(root, 'node_modules')
        writePackage(join(nodeModulesDir, 'host', 'node_modules'), 'target-dep', '2.0.0')

        expect(findInstalledVersion({ nodeModulesDir, dep: 'target-dep' })).toBe('2.0.0')
    })

    it('finds a scoped dependency hoisted at the top level', () => {
        root = mkdtempSync(join(tmpdir(), 'ap-find-'))
        const nodeModulesDir = join(root, 'node_modules')
        writePackage(nodeModulesDir, '@scope/target', '3.1.0')

        expect(findInstalledVersion({ nodeModulesDir, dep: '@scope/target' })).toBe('3.1.0')
    })

    it('returns undefined when the dependency is not installed anywhere', () => {
        root = mkdtempSync(join(tmpdir(), 'ap-find-'))
        const nodeModulesDir = join(root, 'node_modules')
        mkdirSync(nodeModulesDir, { recursive: true })

        expect(findInstalledVersion({ nodeModulesDir, dep: 'missing-dep' })).toBeUndefined()
    })
})

describe('rewriteManifestForBundle', () => {
    let root: string | undefined

    afterEach(() => {
        if (root) {
            rmSync(root, { recursive: true, force: true })
            root = undefined
        }
    })

    function setup(dependencies: Record<string, string>): { distPath: string, repoRoot: string } {
        root = mkdtempSync(join(tmpdir(), 'ap-manifest-'))
        const repoRoot = join(root, 'repo')
        const distPath = join(repoRoot, 'packages', 'pieces', 'community', 'demo', 'dist')
        mkdirSync(distPath, { recursive: true })
        writeFileSync(join(repoRoot, 'package.json'), JSON.stringify({ name: 'root', workspaces: [] }))
        writeFileSync(join(distPath, 'package.json'), JSON.stringify({
            name: '@activepieces/piece-demo',
            version: '1.0.0',
            dependencies,
        }))
        return { distPath, repoRoot }
    }

    function manifestOf(distPath: string): Record<string, unknown> {
        return JSON.parse(readFileSync(join(distPath, 'package.json'), 'utf-8'))
    }

    it('declares an external dependency it can resolve from the piece manifest', () => {
        const { distPath, repoRoot } = setup({ pg: '8.11.3' })

        rewriteManifestForBundle({ distPath, external: ['pg'], repoRoot })

        expect(manifestOf(distPath).dependencies).toEqual({ pg: '8.11.3' })
    })

    it('leaves an optional peer dependency out instead of failing on it', () => {
        const { distPath, repoRoot } = setup({ pg: '8.11.3' })

        rewriteManifestForBundle({ distPath, external: ['pg', 'pg-native'], repoRoot })

        expect(manifestOf(distPath).dependencies).toEqual({ pg: '8.11.3' })
    })

    it('omits an optional peer dependency even when one is installed locally', () => {
        const { distPath, repoRoot } = setup({ mongodb: '6.15.0', kerberos: '2.0.1' })

        rewriteManifestForBundle({ distPath, external: ['mongodb', 'kerberos'], repoRoot })

        expect(manifestOf(distPath).dependencies).toEqual({ mongodb: '6.15.0' })
    })

    it('omits every optional dep the mongodb driver loads behind a guard', () => {
        const { distPath, repoRoot } = setup({ mongodb: '6.15.0' })

        rewriteManifestForBundle({
            distPath,
            external: ['mongodb', 'aws4', 'kerberos', 'snappy', '@mongodb-js/zstd', 'mongodb-client-encryption'],
            repoRoot,
        })

        expect(manifestOf(distPath).dependencies).toEqual({ mongodb: '6.15.0' })
    })

    it('still fails loudly on an external dependency that is simply missing', () => {
        const { distPath, repoRoot } = setup({})

        expect(() => rewriteManifestForBundle({ distPath, external: ['not-a-real-package-xyz'], repoRoot }))
            .toThrow(/has no resolvable version/)
    })
})
