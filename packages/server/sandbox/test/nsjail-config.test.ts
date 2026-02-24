import { describe, it, expect } from 'vitest'
import { generateNsjailConfig } from '../src/lib/nsjail/nsjail-config'
import { CreateSandboxProcessParams } from '../src/lib/types'

describe('generateNsjailConfig', () => {
    it('should generate valid config with all fields', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'test-sandbox-1',
            command: ['node', '/root/main.js'],
            mounts: [
                { hostPath: '/home/user/code', sandboxPath: '/code' },
                { hostPath: '/home/user/libs', sandboxPath: '/libs', optional: true },
            ],
            env: {
                NODE_ENV: 'production',
                API_KEY: 'secret123',
            },
            resourceLimits: {
                memoryBytes: 536870912,
                cpuMsPerSec: 500,
                timeLimitSeconds: 30,
            },
        }

        const config = generateNsjailConfig(params)

        expect(config).toContain('name: "test-sandbox-1"')
        expect(config).toContain('time_limit: 30')
        expect(config).toContain('cgroup_mem_max: 536870912')
        expect(config).toContain('cgroup_cpu_ms_per_sec: 500')
        expect(config).toContain('clone_newnet: false')
        expect(config).toContain('exec_bin {')
        expect(config).toContain('  arg: "node"')
        expect(config).toContain('  arg: "/root/main.js"')
    })

    it('should always include clone_newnet: false', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'net-test',
            command: ['echo', 'hello'],
            mounts: [],
            env: {},
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)
        expect(config).toContain('clone_newnet: false')
    })

    it('should mount /proc', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'proc-test',
            command: ['node', 'app.js'],
            mounts: [],
            env: {},
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)
        expect(config).toContain('src: "/proc"')
        expect(config).toContain('dst: "/proc"')
        expect(config).toContain('fstype: "proc"')
    })

    it('should handle optional mounts with mandatory: false', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'mount-test',
            command: ['node', 'app.js'],
            mounts: [
                { hostPath: '/opt/required', sandboxPath: '/required' },
                { hostPath: '/opt/optional', sandboxPath: '/optional', optional: true },
            ],
            env: {},
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)

        const lines = config.split('\n')

        const requiredMountIndex = lines.findIndex(l => l.includes('dst: "/required"'))
        const optionalMountIndex = lines.findIndex(l => l.includes('dst: "/optional"'))

        expect(requiredMountIndex).toBeGreaterThan(-1)
        expect(optionalMountIndex).toBeGreaterThan(-1)

        const requiredBlock = getBlock(lines, requiredMountIndex)
        const optionalBlock = getBlock(lines, optionalMountIndex)

        expect(requiredBlock).not.toContain('mandatory: false')
        expect(optionalBlock).toContain('mandatory: false')
    })

    it('should escape special characters in env values', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'escape-test',
            command: ['node', 'app.js'],
            mounts: [],
            env: {
                SPECIAL: 'value with "quotes" and \\backslash',
                NEWLINE: 'line1\nline2',
            },
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)

        expect(config).toContain('envar: "SPECIAL=value with \\"quotes\\" and \\\\backslash"')
        expect(config).toContain('envar: "NEWLINE=line1\\nline2"')
    })

    it('should generate env vars in KEY=VALUE format', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'env-test',
            command: ['node', 'app.js'],
            mounts: [],
            env: {
                FOO: 'bar',
                BAZ: 'qux',
            },
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)
        expect(config).toContain('envar: "FOO=bar"')
        expect(config).toContain('envar: "BAZ=qux"')
    })

    it('should generate bind mounts correctly', () => {
        const params: CreateSandboxProcessParams = {
            sandboxId: 'bind-test',
            command: ['node', 'app.js'],
            mounts: [
                { hostPath: '/host/path', sandboxPath: '/sandbox/path' },
            ],
            env: {},
            resourceLimits: {
                memoryBytes: 1024,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 10,
            },
        }

        const config = generateNsjailConfig(params)
        expect(config).toContain('src: "/host/path"')
        expect(config).toContain('dst: "/sandbox/path"')
        expect(config).toContain('is_bind: true')
    })
})

function getBlock(lines: string[], lineIndex: number): string {
    let start = lineIndex
    while (start > 0 && !lines[start].includes('mount {')) {
        start--
    }
    let end = lineIndex
    while (end < lines.length && lines[end] !== '}') {
        end++
    }
    return lines.slice(start, end + 1).join('\n')
}
