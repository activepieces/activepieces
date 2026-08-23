import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Resolve the deno binary shipped by the `deno` npm devDependency so the test
// does not depend on a system-wide install / PATH.
process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

let stepDir: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let denoModule: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let denoCodeSandbox: any

beforeAll(async () => {
    // Dynamic import so AP_DENO_PATH is set before the module reads it.
    denoModule = await import('../../../src/lib/core/code/deno-code-sandbox')
    // The boundary suite asserts the locked profile (the code-only modes) — an
    // empty permission set, so beyond the step-dir read grant every syscall
    // (fs/net/env/run) is denied.
    denoCodeSandbox = denoModule.denoCodeSandbox([])
    stepDir = await mkdtemp(path.join(tmpdir(), 'ap-deno-test-'))
})

afterAll(async () => {
    await rm(stepDir, { recursive: true, force: true })
})

async function runModule(source: string, inputs: Record<string, unknown> = {}): Promise<unknown> {
    const codeFilePath = path.join(stepDir, 'index.ts')
    await writeFile(codeFilePath, source)
    return denoCodeSandbox.runCodeModule({ codeFilePath, inputs })
}

const PERMISSION_DENIED = /NotCapable|PermissionDenied/

describe('denoCodeSandbox permission boundary', () => {
    describe('blocks unpermitted operations', () => {
        it('rejects outbound network access', async () => {
            await expect(runModule(`export const code = async () => (await fetch('https://example.com')).status`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects reading a file outside the step directory', async () => {
            await expect(runModule(`export const code = async () => Deno.readTextFile('/etc/hosts')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects reading environment variables', async () => {
            await expect(runModule(`export const code = async () => Deno.env.toObject()`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects the symlink escape (link inside dir -> outside, read through it)', async () => {
            await expect(runModule(`export const code = async () => {
                await Deno.symlink('/etc/passwd', './escape')
                return Deno.readTextFile('./escape')
            }`)).rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects spawning a subprocess', async () => {
            await expect(runModule(`export const code = async () => {
                const out = await new Deno.Command('sh', { args: ['-c', 'id'] }).output()
                return new TextDecoder().decode(out.stdout)
            }`)).rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects writing outside the step directory', async () => {
            await expect(runModule(`export const code = async () => Deno.writeTextFile('/tmp/ap-pwned.txt', 'hi')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects writing inside the step directory (locked profile grants no write)', async () => {
            await expect(runModule(`export const code = async () => Deno.writeTextFile('./data.json', 'x')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects path traversal out of the step directory', async () => {
            await expect(runModule(`export const code = async () => Deno.readTextFile('../../../../etc/hosts')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })
    })

    describe('allows permitted operations', () => {
        it('runs pure compute over inputs', async () => {
            const result = await runModule(`export const code = async (inputs) => ({ doubled: inputs.n * 2 })`, { n: 21 })
            expect(result).toEqual({ doubled: 42 })
        })

        it('reads files inside its own step directory (needed for module loading)', async () => {
            await writeFile(path.join(stepDir, 'data.txt'), 'step-local')
            const result = await runModule(`export const code = async () => Deno.readTextFile('./data.txt')`)
            expect(result).toBe('step-local')
        })

        it('surfaces user thrown errors', async () => {
            await expect(runModule(`export const code = async () => { throw new Error('boom') }`))
                .rejects.toThrow(/boom/)
        })
    })

    describe('runs TypeScript natively', () => {
        it('type-strips TS syntax without a compile step', async () => {
            const result = await runModule(`
                type Point = { x: number, y: number }
                const scale = (p: Point, f: number): Point => ({ x: p.x * f, y: p.y * f })
                export const code = async (inputs: { f: number }) => scale({ x: 1, y: 2 }, inputs.f)
            `, { f: 3 })
            expect(result).toEqual({ x: 3, y: 6 })
        })

        it('surfaces a TS syntax error as a catchable user failure', async () => {
            await expect(runModule(`export const code = async () => {`))
                .rejects.toThrow(/SyntaxError|Unexpected|expected/i)
        })

        it('rejects a module that does not export a code function', async () => {
            await expect(runModule(`export const notCode = 1`))
                .rejects.toThrow(/must export a "code" function/)
        })
    })

    describe('resolves imports', () => {
        it('supports bare require of node builtins (legacy user code)', async () => {
            const result = await runModule(`const crypto = require('node:crypto'); export const code = async () => crypto.createHash('sha256').update('ap').digest('hex')`)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })

        it('imports node builtins via ESM', async () => {
            const result = await runModule(`import { createHash } from 'node:crypto'; export const code = async () => createHash('sha256').update('ap').digest('hex')`)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })

        it('resolves a CJS npm package from the sibling node_modules', async () => {
            const pkgDir = path.join(stepDir, 'node_modules', 'cjs-fixture')
            await mkdir(pkgDir, { recursive: true })
            await writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'cjs-fixture', version: '1.0.0', main: 'index.js' }))
            await writeFile(path.join(pkgDir, 'index.js'), `module.exports = { greet: (name) => 'hello ' + name }`)
            const result = await runModule(`import { greet } from 'cjs-fixture'; export const code = async () => greet('ap')`)
            expect(result).toBe('hello ap')
        })

        it('resolves an ESM npm package from the sibling node_modules', async () => {
            const pkgDir = path.join(stepDir, 'node_modules', 'esm-fixture')
            await mkdir(pkgDir, { recursive: true })
            await writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'esm-fixture', version: '1.0.0', type: 'module', main: 'index.js' }))
            await writeFile(path.join(pkgDir, 'index.js'), `export const triple = (n) => n * 3`)
            const result = await runModule(`import { triple } from 'esm-fixture'; export const code = async () => triple(14)`)
            expect(result).toBe(42)
        })

        it('rejects remote imports', async () => {
            await expect(runModule(`export const code = async () => (await import('https://example.com/mod.ts')).default`))
                .rejects.toThrow(/Requires import access|--no-remote/i)
        })
    })

    describe('runScript', () => {
        it('evaluates an expression with context', async () => {
            const result = await denoCodeSandbox.runScript({ script: '1 + a', scriptContext: { a: 41 }, functions: {} })
            expect(result).toBe(42)
        })

        it('resolves an async expression', async () => {
            const result = await denoCodeSandbox.runScript({ script: 'Promise.resolve(7)', scriptContext: {}, functions: {} })
            expect(result).toBe(7)
        })

        it('runs without any permissions (network blocked)', async () => {
            await expect(denoCodeSandbox.runScript({ script: `fetch('https://example.com')`, scriptContext: {}, functions: {} }))
                .rejects.toThrow(PERMISSION_DENIED)
        })
    })

    describe('createScriptSession', () => {
        it('shares one context across runs, honors noOverwrite, survives a failed run, blocks network', async () => {
            const session = await denoCodeSandbox.createScriptSession({
                scriptContext: { base: 40 },
                functions: { double: (n: number) => n * 2 },
            })
            try {
                expect(await session.run('base + 2')).toBe(42)
                expect(await session.run('double(base)')).toBe(80)

                await session.setGlobal('step_1', { out: 5 })
                expect(await session.run('step_1.out + base')).toBe(45)

                await session.setGlobal('base', 100)
                expect(await session.run('base')).toBe(40)

                await expect(session.run('missingVar.foo')).rejects.toThrow(/missingVar/)
                expect(await session.run('Promise.resolve(base + step_1.out)')).toBe(45)

                await expect(session.run(`fetch('https://example.com')`)).rejects.toThrow(PERMISSION_DENIED)
            }
            finally {
                session.dispose()
            }
        })
    })
})

describe('denoCodeSandbox permission profiles', () => {
    let dir: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let DenoPermission: any

    beforeAll(async () => {
        ;({ DenoPermission } = denoModule)
        dir = await mkdtemp(path.join(tmpdir(), 'ap-deno-profile-'))
    })

    afterAll(async () => {
        await rm(dir, { recursive: true, force: true })
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function runWith(permissions: any[], source: string): Promise<unknown> {
        const sandbox = denoModule.denoCodeSandbox(permissions)
        const codeFilePath = path.join(dir, 'index.ts')
        await writeFile(codeFilePath, source)
        return sandbox.runCodeModule({ codeFilePath, inputs: {} })
    }

    // Assert the permission state without hitting the network/fs (hermetic for CI).
    // The path grant is queried against os.tmpdir() so it matches the WRITE_TMP/READ_TMP flags.
    const grants = (tmpPath: string): string => `export const code = async () => ({
        net: (await Deno.permissions.query({ name: 'net' })).state,
        env: (await Deno.permissions.query({ name: 'env' })).state,
        run: (await Deno.permissions.query({ name: 'run' })).state,
        sys: (await Deno.permissions.query({ name: 'sys' })).state,
        readEtc: (await Deno.permissions.query({ name: 'read', path: '/etc' })).state,
        readTmp: (await Deno.permissions.query({ name: 'read', path: ${JSON.stringify(tmpPath)} })).state,
        writeTmp: (await Deno.permissions.query({ name: 'write', path: ${JSON.stringify(tmpPath)} })).state,
    })`

    describe('SANDBOX_PROCESS profile (write-tmp, read-tmp, net, env, run, sys)', () => {
        const profile = () => [DenoPermission.WRITE_TMP, DenoPermission.READ_TMP, DenoPermission.NET, DenoPermission.ENV, DenoPermission.RUN, DenoPermission.SYS]

        it('grants net, env, run, sys and tmp read/write; does not grant read outside tmp', async () => {
            const out = await runWith(profile(), grants(tmpdir()))
            // readEtc 'prompt' (not 'granted') = read outside tmp is absent from the flags;
            // --no-prompt turns any such read into a hard NotCapable failure at use time.
            expect(out).toEqual({ net: 'granted', env: 'granted', run: 'granted', sys: 'granted', readEtc: 'prompt', readTmp: 'granted', writeTmp: 'granted' })
        })
    })

    describe('ALL profile (full trust)', () => {
        it('grants all permissions', async () => {
            const out = await runWith([DenoPermission.ALL], grants(tmpdir()))
            expect(out).toEqual({ net: 'granted', env: 'granted', run: 'granted', sys: 'granted', readEtc: 'granted', readTmp: 'granted', writeTmp: 'granted' })
        })
    })
})
