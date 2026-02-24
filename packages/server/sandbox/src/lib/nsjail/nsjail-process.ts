import { spawn } from 'child_process'
import { CreateSandboxProcessParams, SandboxLogger, SandboxProcessMaker } from '../types'
import { generateNsjailConfig } from './nsjail-config'

export function nsjailProcess(log: SandboxLogger): SandboxProcessMaker {
    return {
        create: async (params: CreateSandboxProcessParams) => {
            const config = generateNsjailConfig(params)

            log.debug({ sandboxId: params.sandboxId }, 'Spawning nsjail process')

            const child = spawn('nsjail', ['--config', '/dev/stdin'], {
                stdio: ['pipe', 'pipe', 'pipe'],
            })

            child.stdin.write(config)
            child.stdin.end()

            return child
        },
    }
}
