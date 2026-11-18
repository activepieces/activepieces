import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LddResult, sandboxRuntimeRoot } from '../../../src/lib/sandbox/runtime-root'
import { SandboxLogger } from '../../../src/lib/sandbox/types'

describe('sandboxRuntimeRoot', () => {
    let workDir: string
    let sourceDir: string
    let rootPath: string

    beforeEach(() => {
        workDir = mkdtempSync(path.join(os.tmpdir(), 'runtime-root-test-'))
        sourceDir = path.join(workDir, 'src')
        rootPath = path.join(workDir, 'root')
        mkdirSync(path.join(sourceDir, 'bin'), { recursive: true })
        mkdirSync(path.join(sourceDir, 'lib'), { recursive: true })
        mkdirSync(path.join(sourceDir, 'node_modules/addon/build'), { recursive: true })
        writeSourceFile({ relative: 'bin/node', mode: 0o755 })
        writeSourceFile({ relative: 'bin/deno', mode: 0o755 })
        writeSourceFile({ relative: 'bin/bun', mode: 0o755 })
        writeSourceFile({ relative: 'bin/perl', mode: 0o755 })
        writeSourceFile({ relative: 'lib/libc.so.6.real', mode: 0o644 })
        symlinkSync(path.join(sourceDir, 'lib/libc.so.6.real'), path.join(sourceDir, 'lib/libc.so.6'))
        writeSourceFile({ relative: 'lib/libstdc++.so.6', mode: 0o644 })
        writeSourceFile({ relative: 'lib/libaddon-dep.so', mode: 0o644 })
        writeSourceFile({ relative: 'node_modules/addon/index.js', mode: 0o644 })
        writeSourceFile({ relative: 'node_modules/addon/build/addon.node', mode: 0o755 })
    })

    afterEach(() => {
        rmSync(workDir, { recursive: true, force: true })
    })

    function writeSourceFile({ relative, mode }: { relative: string, mode: number }): void {
        const file = path.join(sourceDir, relative)
        writeFileSync(file, `content of ${relative}`)
        chmodSync(file, mode)
    }

    function src(relative: string): string {
        return path.join(sourceDir, relative)
    }

    function fakeLdd(): (params: { file: string }) => Promise<LddResult | null> {
        const table: Record<string, LddResult> = {
            [src('bin/node')]: { libraries: [src('lib/libc.so.6'), src('lib/libstdc++.so.6')], missing: [] },
            [src('bin/deno')]: { libraries: [src('lib/libc.so.6')], missing: [] },
            [src('node_modules/addon/build/addon.node')]: { libraries: [src('lib/libaddon-dep.so')], missing: [] },
        }
        return async ({ file }) => table[file] ?? null
    }

    function sources() {
        return {
            executables: [src('bin/node'), src('bin/deno')],
            optionalExecutables: [src('bin/missing-tool')],
            directories: [src('node_modules')],
            dataFiles: [],
        }
    }

    async function buildRoot(listSharedLibraries = fakeLdd()): Promise<string> {
        return sandboxRuntimeRoot.build({ log: createMockLogger(), rootPath, sources: sources(), listSharedLibraries })
    }

    function listFiles(dir: string): string[] {
        return readdirSync(dir, { recursive: true, withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
            .sort()
    }

    it('copies the executables, their libraries and the module directories at their box paths', async () => {
        await buildRoot()
        const inRoot = (boxPath: string) => path.join(rootPath, boxPath).slice(rootPath.length + 1)
        expect(listFiles(rootPath)).toEqual([
            '.manifest.json',
            inRoot(src('bin/deno')),
            inRoot(src('bin/node')),
            inRoot(src('lib/libaddon-dep.so')),
            inRoot(src('lib/libc.so.6')),
            inRoot(src('lib/libstdc++.so.6')),
            inRoot(src('node_modules/addon/build/addon.node')),
            inRoot(src('node_modules/addon/index.js')),
        ].sort())
    })

    it('leaves out every binary that is not on the list', async () => {
        await buildRoot()
        const files = listFiles(rootPath)
        expect(files.some((file) => file.endsWith('bin/bun'))).toBe(false)
        expect(files.some((file) => file.endsWith('bin/perl'))).toBe(false)
        expect(files.some((file) => file.endsWith('missing-tool'))).toBe(false)
    })

    it('gives every copied file its own inode, never shared with the source', async () => {
        await buildRoot()
        const copied = listFiles(rootPath).filter((file) => file !== '.manifest.json')
        for (const relative of copied) {
            const inside = statSync(path.join(rootPath, relative))
            const outside = statSync(path.join('/', relative))
            expect(`${inside.dev}:${inside.ino}`).not.toBe(`${outside.dev}:${outside.ino}`)
            expect(inside.nlink).toBe(1)
        }
    })

    it('copies symlinked libraries as regular files with the target content', async () => {
        await buildRoot()
        const copiedLibc = path.join(rootPath, src('lib/libc.so.6'))
        expect(statSync(copiedLibc).isFile()).toBe(true)
        expect(readdirSync(path.dirname(copiedLibc))).not.toContain('libc.so.6.real')
    })

    it('keeps the execute bit on executables and strips setuid', async () => {
        chmodSync(src('bin/node'), 0o4755)
        await buildRoot()
        expect(statSync(path.join(rootPath, src('bin/node'))).mode & 0o7777).toBe(0o755)
        expect(statSync(path.join(rootPath, src('lib/libstdc++.so.6'))).mode & 0o7777).toBe(0o644)
    })

    it('reuses an existing root when nothing changed', async () => {
        await buildRoot()
        const before = statSync(path.join(rootPath, src('bin/node'))).ino
        await buildRoot()
        expect(statSync(path.join(rootPath, src('bin/node'))).ino).toBe(before)
    })

    it('rebuilds the root when a source file changes', async () => {
        await buildRoot()
        writeFileSync(src('bin/node'), 'a newer node')
        utimesSync(src('bin/node'), new Date(), new Date(Date.now() + 5000))
        await buildRoot()
        expect(statSync(path.join(rootPath, src('bin/node'))).size).toBe('a newer node'.length)
        expect(readdirSync(workDir).filter((entry) => entry.includes('.staging-') || entry.includes('.previous-'))).toEqual([])
    })

    it('fails when a required executable has an unresolved library', async () => {
        const ldd = async ({ file }: { file: string }): Promise<LddResult | null> => file === src('bin/deno') ? { libraries: [], missing: ['libgone.so.1'] } : fakeLdd()({ file })
        await expect(buildRoot(ldd)).rejects.toThrow(/libgone\.so\.1/)
    })

    it('fails when a required executable does not exist', async () => {
        rmSync(src('bin/deno'))
        await expect(buildRoot()).rejects.toThrow()
    })

    it('copies a data file such as a custom CA certificate without resolving libraries for it', async () => {
        mkdirSync(src('share/ca-certificates'), { recursive: true })
        writeSourceFile({ relative: 'share/ca-certificates/my-ca.pem', mode: 0o644 })
        await sandboxRuntimeRoot.build({
            log: createMockLogger(),
            rootPath,
            sources: { ...sources(), dataFiles: [src('share/ca-certificates/my-ca.pem'), src('share/ca-certificates/absent.pem')] },
            listSharedLibraries: fakeLdd(),
        })
        const copied = path.join(rootPath, src('share/ca-certificates/my-ca.pem'))
        expect(readFileSync(copied, 'utf8')).toBe('content of share/ca-certificates/my-ca.pem')
        expect(statSync(copied).mode & 0o7777).toBe(0o644)
        expect(listFiles(rootPath).some((file) => file.endsWith('absent.pem'))).toBe(false)
    })

    it('removes the staging folder when a copy fails', async () => {
        const ldd = async ({ file }: { file: string }): Promise<LddResult | null> => file === src('lib') ? { libraries: [], missing: [] } : fakeLdd()({ file })
        await expect(sandboxRuntimeRoot.build({
            log: createMockLogger(),
            rootPath,
            sources: { ...sources(), executables: [src('bin/node'), src('lib')] },
            listSharedLibraries: ldd,
        })).rejects.toThrow()
        expect(readdirSync(workDir).filter((entry) => entry.includes('.staging-'))).toEqual([])
        expect(readdirSync(workDir)).not.toContain('root')
    })

    describe('defaultSources', () => {
        it('includes the custom CA certificate when its path is inside a directory the box mounts', () => {
            const result = sandboxRuntimeRoot.defaultSources({ env: { NODE_EXTRA_CA_CERTS: '/usr/local/share/ca-certificates/my-ca.pem', AP_DENO_PATH: '/usr/local/bin/deno' }, execPath: '/usr/local/bin/node' })
            expect(result.dataFiles).toEqual(['/usr/local/share/ca-certificates/my-ca.pem'])
            expect(result.executables).toEqual(['/usr/local/bin/node', '/usr/local/bin/deno'])
        })

        it.each(['/etc/ssl/my-ca.pem', '/tmp/my-ca.pem', '/usr/../etc/shadow', '/usrlocal/ca.pem'])('leaves out a certificate path the box cannot see: %s', (certPath) => {
            expect(sandboxRuntimeRoot.defaultSources({ env: { NODE_EXTRA_CA_CERTS: certPath }, execPath: '/usr/local/bin/node' }).dataFiles).toEqual([])
        })

        it('has no data files when no custom CA certificate is configured', () => {
            expect(sandboxRuntimeRoot.defaultSources({ env: {}, execPath: '/usr/local/bin/node' }).dataFiles).toEqual([])
        })
    })

    describe('parseLddOutput', () => {
        it('reads resolved libraries and the loader, and reports missing ones', () => {
            const output = [
                '\tlinux-vdso.so.1 (0x00007fff8579d000)',
                '\tlibstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x000079bfac95f000)',
                '\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x000079bfac676000)',
                '\tlibgone.so.1 => not found',
                '\t/lib64/ld-linux-x86-64.so.2 (0x000079bfacb83000)',
            ].join('\n')
            expect(sandboxRuntimeRoot.parseLddOutput({ output })).toEqual({
                libraries: ['/lib/x86_64-linux-gnu/libstdc++.so.6', '/lib/x86_64-linux-gnu/libc.so.6', '/lib64/ld-linux-x86-64.so.2'],
                missing: ['libgone.so.1'],
            })
        })
    })

    describe.runIf(process.platform === 'linux' && spawnSync('ldd', ['--version']).status === 0)('with the real node binary and ldd', () => {
        it('produces a root whose node runs on the copied libraries alone', async () => {
            await sandboxRuntimeRoot.build({
                log: createMockLogger(),
                rootPath,
                sources: { executables: [process.execPath], optionalExecutables: [], directories: [], dataFiles: [] },
            })
            const loader = ['/lib64/ld-linux-x86-64.so.2', '/lib/ld-linux-aarch64.so.1'].find((candidate) => listFiles(rootPath).includes(candidate.slice(1)))
            expect(loader).toBeDefined()
            const libraryDirs = [...new Set(listFiles(rootPath).filter((file) => file.includes('.so')).map((file) => path.join(rootPath, path.dirname(file))))]
            const result = spawnSync(path.join(rootPath, loader ?? ''), ['--inhibit-cache', '--library-path', libraryDirs.join(':'), path.join(rootPath, process.execPath), '-e', 'console.log(process.versions.node)'], { encoding: 'utf8' })
            expect(result.stdout.trim()).toBe(process.versions.node)
            const outside = statSync(process.execPath)
            const inside = statSync(path.join(rootPath, process.execPath))
            expect(inside.ino).not.toBe(outside.ino)
        }, 60_000)
    })
})

function createMockLogger(): SandboxLogger {
    return { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() }
}
