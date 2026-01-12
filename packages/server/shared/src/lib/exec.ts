import { exec as execCallback, spawn } from 'node:child_process'
import type { SpawnOptions } from 'node:child_process'
import { promisify } from 'node:util'
import treeKill from 'tree-kill'

export const execPromise = promisify(execCallback)

export async function spawnWithKill({
    cmd,
    options = {},
    printOutput,
    timeoutMs,
}: SpawnWithKillParams): Promise<CommandOutput> {

    return new Promise((resolve, reject) => {
        const [command, ...args] = cmd.split(' ')
        const cp = spawn(command, args, {
            detached: true,
            shell: true,
            ...options,
        })

        let stdout = ''
        let stderr = ''

        if (cp.stdout) {
            cp.stdout.on('data', data => {
                if (printOutput) process.stdout.write(data)
                stdout += data
            })
        }

        if (cp.stderr) {
            cp.stderr.on('data', data => {
                if (printOutput) process.stderr.write(data)
                stderr += data
            })
        }

        let finished = false
        let timeoutHandler: NodeJS.Timeout | undefined

        const finish = (err?: Error | null) => {
            if (finished) return
            finished = true

            if (timeoutHandler) clearTimeout(timeoutHandler)

            if (!cp.pid) {
                return err ? reject(err) : resolve({ stdout, stderr })
            }

            treeKill(cp.pid, 'SIGKILL', () => {
                if (err) reject(err)
                else resolve({ stdout, stderr })
            })
        }

        if (timeoutMs && timeoutMs > 0) {
            timeoutHandler = setTimeout(() => {
                finish(
                    new Error(
                        `Timeout after ${timeoutMs}ms\nstdout: ${stdout}\nstderr: ${stderr}`,
                    ),
                )
            }, timeoutMs)
        }

        cp.on('error', err => finish(err))
        cp.on('close', (code, signal) => {
            if (code !== 0) {
                return finish(
                    new Error(
                        `Exit ${code}${signal ? ` (signal ${signal})` : ''}\nstdout: ${stdout}\nstderr: ${stderr}`,
                    ),
                )
            }
            finish()
        })
    })
}


type SpawnWithKillParams = {
    cmd: string
    options?: SpawnOptions
    printOutput?: boolean
    timeoutMs?: number
}

export type CommandOutput = {
    stdout: string
    stderr: string
}