import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, unlinkSync } from 'fs'
import path from 'path'
import os from 'os'
import { CreateSandboxProcessParams, SandboxLogger, SandboxProcessMaker } from '../types'
import { generateNsjailConfig } from './nsjail-config'

export function nsjailProcess(log: SandboxLogger): SandboxProcessMaker {
    return {
        create: async (params: CreateSandboxProcessParams) => {
            const config = generateNsjailConfig(params)

            log.debug({ sandboxId: params.sandboxId }, 'Spawning nsjail process')

            const configDir = path.join(os.tmpdir(), 'nsjail-configs')
            mkdirSync(configDir, { recursive: true })
            const configPath = path.join(configDir, `${params.sandboxId}.cfg`)
            writeFileSync(configPath, config)

            const child = spawn('nsjail', ['--config', configPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
            })

            child.on('exit', () => {
                try {
                    unlinkSync(configPath)
                }
                catch {
                    // ignore cleanup errors
                }
            })

            return child
        },
    }
}
