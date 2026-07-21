import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import path from 'path'
import { arch } from 'process'
import { execPromise } from '../utils/exec'
import { CreateSandboxProcessParams, SandboxLogger, SandboxMount, SandboxProcessMaker } from './types'

export function getIsolateExecutableName(nodeArch: NodeJS.Architecture = arch): string {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<NodeJS.Architecture, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }
    return executableNameMap[nodeArch] ?? defaultName
}

function assertMountInsideRoot(mount: SandboxMount): void {
    const normalized = path.posix.normalize(mount.sandboxPath)
    if (!normalized.startsWith('/root/') && normalized !== '/root') {
        throw new Error(`Refusing to mount outside sandbox rootfs: sandboxPath="${mount.sandboxPath}"`)
    }
}

const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const FORBIDDEN_VALUE_CHARS = /[\n\r\0]/
const REQUIRED_SANDBOX_ENV_KEYS: readonly string[] = [
    'HOME',
    'NODE_PATH',
    'AP_EXECUTION_MODE',
    'AP_SANDBOX_WS_PORT',
    'AP_SANDBOX_WS_TOKEN',
    'AP_BASE_CODE_DIRECTORY',
    'SANDBOX_ID',
]

function assertSandboxEnv(env: Record<string, string>): void {
    for (const [key, value] of Object.entries(env)) {
        if (!ENV_KEY_RE.test(key)) {
            throw new Error(`Invalid sandbox env key: "${key}" — must match ${ENV_KEY_RE}`)
        }
        if (typeof value !== 'string') {
            throw new Error(`Invalid sandbox env value for "${key}": expected string, got ${typeof value}`)
        }
        if (FORBIDDEN_VALUE_CHARS.test(value)) {
            throw new Error(`Invalid sandbox env value for "${key}": must not contain newlines or NUL bytes`)
        }
    }
    for (const key of REQUIRED_SANDBOX_ENV_KEYS) {
        if (typeof env[key] !== 'string' || env[key].length === 0) {
            throw new Error(`Required sandbox env "${key}" is missing or empty`)
        }
    }
}

const isolateBinaryPath = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())
const etcDir = path.resolve(process.cwd(), 'packages/server/api/src/assets/etc')

export function isolateProcess(log: SandboxLogger, enginePath: string, _codeDirectory: string, boxId: number): SandboxProcessMaker {
    return {
        create: async (params: CreateSandboxProcessParams) => {
            const { sandboxId, mounts, env, netnsName } = params

            for (const mount of mounts) {
                assertMountInsideRoot(mount)
            }

            const engineSandboxPath = path.join('/root/common', path.basename(enginePath))
            const sandboxEnv = {
                ...env,
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: sandboxId,
                // /tmp is not mounted in the isolate sandbox (--no-default-dirs), so Node's
                // os.tmpdir() default of /tmp fails with EACCES for pieces that write temp
                // files. /box is the per-box writable scratch mount, so point TMPDIR there.
                TMPDIR: '/box',
                TMP: '/box',
                TEMP: '/box',
            }
            assertSandboxEnv(sandboxEnv)

            await execPromise(`${isolateBinaryPath} --box-id=${boxId} --cleanup`)
            await execPromise(`${isolateBinaryPath} --box-id=${boxId} --init`)

            const sandboxRootfs = `/var/local/lib/isolate/${boxId}/root`
            for (const mount of mounts) {
                await mkdir(`${sandboxRootfs}${mount.sandboxPath}`, { recursive: true })
            }

            const envArgs = Object.entries(sandboxEnv)
                .map(([key, value]) => `--env=${key}=${value}`)

            const dirArgs = mounts.map((m) => {
                const suffix = m.optional ? ':maybe' : ''
                return `--dir=${m.sandboxPath}=${m.hostPath}${suffix}`
            })

            const args = [
                '--no-default-dirs',
                '--dir=/bin/',
                '--dir=/lib/',
                '--dir=/lib64/:maybe',
                '--dir=/usr/bin/',
                '--dir=/usr/lib/',
                '--dir=/usr/local/',
                `--dir=/etc/=${etcDir}`,
                '--dir=/usr/src/node_modules/',
                '--dir=proc=proc:fs',
                '--dir=/dev=/dev:dev',
                // isolate uses /box internally as its initial working dir, even when --chdir overrides it.
                // With --no-default-dirs that auto-mount disappears, so we add it back explicitly.
                `--dir=/box=/var/local/lib/isolate/${boxId}/box:rw`,
                ...dirArgs,
                '--share-net',
                `--box-id=${boxId}`,
                '--processes',
                '--chdir=/root',
                ...envArgs,
                '--run',
                '--',
                process.execPath,
                engineSandboxPath,
            ]

            // In STRICT + isolate modes the box is launched inside a pre-provisioned, locked-down
            // network namespace via `ip netns exec`. `--share-net` then makes isolate inherit THAT
            // netns (not the host's), so untrusted code is confined to the veth /30 whose only routes
            // are NAT'd public egress + the gateway WS-RPC — never host loopback, metadata, or RFC1918.
            const spawnCommand = netnsName ? 'ip' : isolateBinaryPath
            const spawnArgs = netnsName ? ['netns', 'exec', netnsName, isolateBinaryPath, ...args] : args

            log.debug({ sandbox: { id: sandboxId }, netnsName: netnsName ?? 'host', command: `${spawnCommand} ${spawnArgs.join(' ')}` }, 'Spawning isolate process')

            const child = spawn(spawnCommand, spawnArgs, {
                shell: false,
            })

            return child
        },
    }
}
