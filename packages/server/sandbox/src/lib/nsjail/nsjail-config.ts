import { CreateSandboxProcessParams } from '../types'

/**
 * nsjail protobuf text-format config template.
 * Placeholders are replaced at runtime by {@link generateNsjailConfig}.
 *
 * @see https://github.com/google/nsjail (config.proto)
 * @see https://github.com/windmill-labs/windmill/tree/main/backend/windmill-worker/nsjail
 */
const CONFIG_TEMPLATE = `\
name: "{SANDBOX_ID}"

mode: ONCE
time_limit: {TIME_LIMIT_SECONDS}

clone_newnet: false
clone_newuser: true
clone_newns: true
clone_newpid: true
clone_newipc: true
clone_newuts: true

{CGROUP_CONFIG}

mount {
  src: "/usr"
  dst: "/usr"
  is_bind: true
  rw: false
}

mount {
  src: "/lib"
  dst: "/lib"
  is_bind: true
  rw: false
}

mount {
  src: "/proc"
  dst: "/proc"
  fstype: "proc"
  rw: false
}

mount {
  dst: "/tmp"
  fstype: "tmpfs"
  rw: true
}

{EXTRA_MOUNTS}

{ENVARS}

{EXEC_BIN}
`

export function generateNsjailConfig(params: CreateSandboxProcessParams): string {
    const { sandboxId, resourceLimits, mounts, env, command } = params

    const hasCgroupLimits = resourceLimits.memoryBytes > 0 || resourceLimits.cpuMsPerSec > 0

    return CONFIG_TEMPLATE
        .replace('{SANDBOX_ID}', esc(sandboxId))
        .replace('{TIME_LIMIT_SECONDS}', String(resourceLimits.timeLimitSeconds))
        .replace('{CGROUP_CONFIG}', hasCgroupLimits
            ? [
                'detect_cgroupv2: true',
                `cgroup_mem_max: ${resourceLimits.memoryBytes}`,
                `cgroup_cpu_ms_per_sec: ${resourceLimits.cpuMsPerSec}`,
            ].join('\n')
            : '')
        .replace('{EXTRA_MOUNTS}', mounts.map((m) =>
            `mount {\n  src: "${esc(m.hostPath)}"\n  dst: "${esc(m.sandboxPath)}"\n  is_bind: true\n  rw: false${m.optional ? '\n  mandatory: false' : ''}\n}`,
        ).join('\n\n'))
        .replace('{ENVARS}', Object.entries(env)
            .map(([key, value]) => `envar: "${esc(key)}=${esc(value)}"`)
            .join('\n'))
        .replace('{EXEC_BIN}', command.length > 0
            ? `exec_bin {\n  path: "${esc(command[0])}"${command.slice(1).map((arg) => `\n  arg: "${esc(arg)}"`).join('')}\n}`
            : '')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd()
}

function esc(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
}
