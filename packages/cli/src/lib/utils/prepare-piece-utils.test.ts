import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findInstalledVersion } from './prepare-piece-utils'

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
