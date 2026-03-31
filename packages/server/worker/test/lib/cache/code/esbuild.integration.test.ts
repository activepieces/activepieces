import { rm, writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Logger } from 'pino'
import { packageRunner } from '../../../../src/lib/cache/code/package-runner'

const fakeLog = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
} as unknown as Logger

let tempDir: string

beforeEach(async () => {
    tempDir = join(tmpdir(), `esbuild-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })
})

afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
})

const requireDynamic = createRequire(import.meta.url)

describe('packageRunner.build (integration)', () => {
    it('basic AP format compiles and is callable', async () => {
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(entryFile, `export const code = async (inputs) => { return true; };`)

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const mod = requireDynamic(outputFile)
        expect(typeof mod.code).toBe('function')
        expect(await mod.code({})).toBe(true)
    })

    it('TypeScript types are stripped', async () => {
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(entryFile, `export const code = async (inputs: { x: number }) => { return inputs.x * 2; };`)

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const mod = requireDynamic(outputFile)
        expect(await mod.code({ x: 21 })).toBe(42)
    })

    it('output is CommonJS — no ESM syntax', async () => {
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(entryFile, `export const code = async (inputs) => { return true; };`)

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const content = readFileSync(outputFile, 'utf-8')
        expect(content).not.toMatch(/^export /m)
        expect(content).toMatch(/exports\.|module\.exports/)
    })

    it('invalid syntax → build rejects', async () => {
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(entryFile, `export const code = async (inputs) => { return @@@; };`)

        await expect(packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })).rejects.toThrow()
    })

    it('code using lodash — full install + build pipeline', { timeout: 30_000 }, async () => {
        const packageJsonFile = join(tempDir, 'package.json')
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(packageJsonFile, JSON.stringify({ dependencies: { lodash: '4.17.21' } }))
        await packageRunner(fakeLog).install({ path: tempDir })

        await writeFile(entryFile, [
            `import _ from 'lodash';`,
            `export const code = async (inputs: { arr: number[] }) => {`,
            `  return _.sum(inputs.arr);`,
            `};`,
        ].join('\n'))

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const mod = requireDynamic(outputFile)
        expect(await mod.code({ arr: [1, 2, 3] })).toBe(6)
    })

    it('code using hello-world-npm — full install + build pipeline', { timeout: 30_000 }, async () => {
        const packageJsonFile = join(tempDir, 'package.json')
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(packageJsonFile, JSON.stringify({ dependencies: { 'hello-world-npm': '1.1.1' } }))
        await packageRunner(fakeLog).install({ path: tempDir })

        await writeFile(entryFile, [
            `import helloWorldNpm from 'hello-world-npm';`,
            `export const code = async (inputs) => {`,
            `  return helloWorldNpm();`,
            `};`,
        ].join('\n'))

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const mod = requireDynamic(outputFile)
        expect(await mod.code({})).toBe('Hello World NPM')
    })

    it('hello-world@0.0.2 has no main entry — install succeeds but build rejects', { timeout: 30_000 }, async () => {
        // hello-world@0.0.2 has no "main" field and no index.js — no bundler can resolve it.
        // This was always broken (verified: bun build fails identically). Not a regression.
        const packageJsonFile = join(tempDir, 'package.json')
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(packageJsonFile, JSON.stringify({ dependencies: { 'hello-world': '0.0.2' } }))
        await packageRunner(fakeLog).install({ path: tempDir })

        await writeFile(entryFile, [
            `import helloWorld from 'hello-world';`,
            `export const code = async (inputs) => {`,
            `  const result = helloWorld();`,
            `  return result;`,
            `};`,
        ].join('\n'))

        await expect(packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })).rejects.toThrow()
    })

    it('code using dayjs — full install + build pipeline', { timeout: 30_000 }, async () => {
        const packageJsonFile = join(tempDir, 'package.json')
        const entryFile = join(tempDir, 'index.ts')
        const outputFile = join(tempDir, 'index.js')

        await writeFile(packageJsonFile, JSON.stringify({ dependencies: { dayjs: '1.11.0' } }))
        await packageRunner(fakeLog).install({ path: tempDir })

        await writeFile(entryFile, [
            `import dayjs from 'dayjs';`,
            `export const code = async (inputs: { iso: string }) => {`,
            `  return dayjs(inputs.iso).year();`,
            `};`,
        ].join('\n'))

        await packageRunner(fakeLog).build({ path: tempDir, entryFile, outputFile })

        const mod = requireDynamic(outputFile)
        expect(await mod.code({ iso: '2024-06-15' })).toBe(2024)
    })
})
