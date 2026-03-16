import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fork } from 'node:child_process'
import { describe, it, expect, afterEach, beforeEach } from 'vitest'

describe('cross-process file lock', () => {
    let testDir: string

    beforeEach(async () => {
        testDir = join(tmpdir(), `cross-proc-lock-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true })
    })

    function runChildProcess(scriptPath: string): Promise<{ stdout: string, exitCode: number }> {
        return new Promise((resolve, reject) => {
            const child = fork(scriptPath, [], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: { ...process.env, NODE_OPTIONS: '' },
            })
            let stdout = ''
            child.stdout?.on('data', (data) => { stdout += data.toString() })
            child.stderr?.on('data', (data) => { stdout += data.toString() })
            child.on('exit', (code) => resolve({ stdout, exitCode: code ?? 1 }))
            child.on('error', reject)
        })
    }

    it('5 child processes incrementing a shared counter via file lock', async () => {
        const counterFile = join(testDir, 'counter.txt')
        const lockPath = join(testDir, 'counter')
        const N_PROCESSES = 5
        const INCREMENTS_PER_PROCESS = 10

        await writeFile(counterFile, '0')

        // Write the child worker script
        const workerScript = join(testDir, 'worker.mjs')
        await writeFile(workerScript, `
import { mkdir, rm, stat, readFile, writeFile } from 'node:fs/promises';

const RETRY_MS = 50;
const lockPath = process.argv[2];
const counterFile = process.argv[3];
const increments = parseInt(process.argv[4], 10);

async function acquireLock(lockDir) {
    while (true) {
        try {
            await mkdir(lockDir, { recursive: false });
            return;
        } catch (err) {
            if (err.code === 'EEXIST') {
                // Check staleness
                try {
                    const s = await stat(lockDir);
                    if (Date.now() - s.mtimeMs > 60000) {
                        await rm(lockDir, { recursive: true }).catch(() => {});
                        continue;
                    }
                } catch { continue; }
                await new Promise(r => setTimeout(r, RETRY_MS));
                continue;
            }
            throw err;
        }
    }
}

async function releaseLock(lockDir) {
    await rm(lockDir, { recursive: true }).catch(() => {});
}

async function main() {
    const lockDir = lockPath + '.lock';
    for (let i = 0; i < increments; i++) {
        await acquireLock(lockDir);
        try {
            const raw = await readFile(counterFile, 'utf8');
            const val = parseInt(raw, 10);
            await writeFile(counterFile, String(val + 1));
        } finally {
            await releaseLock(lockDir);
        }
    }
    process.stdout.write('done');
}

main().catch(e => { process.stderr.write(e.message); process.exit(1); });
`)

        // Launch N child processes
        const children = Array.from({ length: N_PROCESSES }, () =>
            runChildProcess(workerScript).then(r => r),
        )

        // We need to pass args — fork doesn't support inline args, use execArgv workaround
        // Actually, let's rewrite to use spawn instead
        const { execFile } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execFileAsync = promisify(execFile)

        const processes = Array.from({ length: N_PROCESSES }, () =>
            execFileAsync('node', [workerScript, lockPath, counterFile, String(INCREMENTS_PER_PROCESS)], {
                timeout: 30000,
            }),
        )

        const results = await Promise.all(processes)

        // All processes should complete successfully
        for (const r of results) {
            expect(r.stdout).toBe('done')
        }

        // Counter should be exactly N_PROCESSES * INCREMENTS_PER_PROCESS
        const finalValue = parseInt(await readFile(counterFile, 'utf8'), 10)
        const expected = N_PROCESSES * INCREMENTS_PER_PROCESS
        console.log(`[CROSS-PROCESS] ${N_PROCESSES} processes x ${INCREMENTS_PER_PROCESS} increments = ${finalValue} (expected ${expected})`)
        expect(finalValue).toBe(expected)
    }, 60_000)

    it('counter without locking shows race condition (demonstrates need for locks)', async () => {
        const counterFile = join(testDir, 'unlocked-counter.txt')
        const N_PROCESSES = 5
        const INCREMENTS_PER_PROCESS = 20

        await writeFile(counterFile, '0')

        // Write the unlocked worker script (no locking — to show the race)
        const workerScript = join(testDir, 'unlocked-worker.mjs')
        await writeFile(workerScript, `
import { readFile, writeFile } from 'node:fs/promises';

const counterFile = process.argv[2];
const increments = parseInt(process.argv[3], 10);

async function main() {
    for (let i = 0; i < increments; i++) {
        const raw = await readFile(counterFile, 'utf8');
        const val = parseInt(raw, 10);
        // Small delay to widen the race window
        await new Promise(r => setTimeout(r, 1));
        await writeFile(counterFile, String(val + 1));
    }
    process.stdout.write('done');
}

main().catch(e => { process.stderr.write(e.message); process.exit(1); });
`)

        const { execFile } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execFileAsync = promisify(execFile)

        const processes = Array.from({ length: N_PROCESSES }, () =>
            execFileAsync('node', [workerScript, counterFile, String(INCREMENTS_PER_PROCESS)], {
                timeout: 30000,
            }),
        )

        const results = await Promise.all(processes)
        for (const r of results) {
            expect(r.stdout).toBe('done')
        }

        const finalValue = parseInt(await readFile(counterFile, 'utf8'), 10)
        const expected = N_PROCESSES * INCREMENTS_PER_PROCESS
        console.log(`[CROSS-PROCESS UNLOCKED] ${N_PROCESSES} processes x ${INCREMENTS_PER_PROCESS} = ${finalValue} (expected ${expected}, likely WRONG due to races)`)

        // We DON'T assert correctness here — this test demonstrates the race condition
        // The value will almost certainly be less than expected
        // This is intentional — it proves why the file lock is needed
        if (finalValue < expected) {
            console.log(`[CROSS-PROCESS UNLOCKED] Race condition confirmed: lost ${expected - finalValue} increments`)
        }
    }, 60_000)
})
