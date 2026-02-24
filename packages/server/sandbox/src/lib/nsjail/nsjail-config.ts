import { CreateSandboxProcessParams } from '../types'

export function generateNsjailConfig(params: CreateSandboxProcessParams): string {
    const lines: string[] = []

    lines.push(`name: "${escapeProtobuf(params.sandboxId)}"`)
    lines.push('')

    lines.push('mode: ONCE')
    lines.push(`time_limit: ${params.resourceLimits.timeLimitSeconds}`)
    lines.push('')

    lines.push('clone_newnet: false')
    lines.push('clone_newuser: true')
    lines.push('clone_newns: true')
    lines.push('clone_newpid: true')
    lines.push('clone_newipc: true')
    lines.push('clone_newuts: true')
    lines.push('')

    lines.push(`cgroup_mem_max: ${params.resourceLimits.memoryBytes}`)
    lines.push(`cgroup_cpu_ms_per_sec: ${params.resourceLimits.cpuMsPerSec}`)
    lines.push('')

    lines.push('mount {')
    lines.push('  src: "/proc"')
    lines.push('  dst: "/proc"')
    lines.push('  fstype: "proc"')
    lines.push('  rw: false')
    lines.push('}')
    lines.push('')

    for (const mount of params.mounts) {
        lines.push('mount {')
        lines.push(`  src: "${escapeProtobuf(mount.hostPath)}"`)
        lines.push(`  dst: "${escapeProtobuf(mount.sandboxPath)}"`)
        lines.push('  is_bind: true')
        lines.push('  rw: false')
        if (mount.optional) {
            lines.push('  mandatory: false')
        }
        lines.push('}')
        lines.push('')
    }

    for (const [key, value] of Object.entries(params.env)) {
        lines.push(`envar: "${escapeProtobuf(key)}=${escapeProtobuf(value)}"`)
    }
    if (Object.keys(params.env).length > 0) {
        lines.push('')
    }

    if (params.command.length > 0) {
        lines.push('exec_bin {')
        for (const arg of params.command) {
            lines.push(`  arg: "${escapeProtobuf(arg)}"`)
        }
        lines.push('}')
    }

    return lines.join('\n')
}

function escapeProtobuf(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
}
