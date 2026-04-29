import { execFileSync } from 'node:child_process'

const SKIP_REASON = 'requires Linux + root + iptables binary; run via `npm run test:sandbox-e2e` from repo root'

export function requireLinuxPrivileged(): SkipReason | undefined {
    if (process.platform !== 'linux') {
        return { skip: true, reason: `${SKIP_REASON} (platform=${process.platform})` }
    }
    const uid = typeof process.getuid === 'function' ? process.getuid() : -1
    if (uid !== 0) {
        return { skip: true, reason: `${SKIP_REASON} (uid=${uid})` }
    }
    try {
        execFileSync('iptables', ['-V'], { stdio: 'pipe' })
    }
    catch (err) {
        return { skip: true, reason: `${SKIP_REASON} (${(err as Error).message})` }
    }
    return undefined
}

export function requireIsolateBinary(binaryPath: string): SkipReason | undefined {
    try {
        execFileSync(binaryPath, ['--version'], { stdio: 'pipe' })
    }
    catch (err) {
        return { skip: true, reason: `isolate binary not runnable at ${binaryPath} — ${(err as Error).message}` }
    }
    return undefined
}

export type SkipReason = {
    skip: true
    reason: string
}
