import { exec, exec as execCallback, spawn } from 'node:child_process'
import type { SpawnOptions } from 'node:child_process'
import { promisify } from 'node:util'

export const execPromise = promisify(execCallback)

export type CommandOutput = {
    stdout: string
    stderr: string
}

export function execWithTimeout({ command, cwd, timeoutMs }: ExecWithTimeoutParams): Promise<CommandOutput> {
    return new Promise<CommandOutput>((resolve, reject) => {
        const child = exec(command, {
            cwd,
        }, (error, stdout, stderr) => {
            if (timeoutHandle) clearTimeout(timeoutHandle);

            if (error) {
                reject(error);
                return;
            }
            resolve({ stdout, stderr });
        });

        const timeoutHandle = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error(`Timed out after ${timeoutMs}ms executing command: ${command}`));
        }, timeoutMs);
    });
}

type ExecWithTimeoutParams = {
    command: string
    cwd: string
    timeoutMs: number
}

export async function runCommandWithLiveOutput(
    cmd: string,
    options: SpawnOptions = {},
): Promise<CommandOutput> {
    const [command, ...args] = cmd.split(' ')

    return new Promise<CommandOutput>((resolve, reject) => {
        const child = spawn(command, args, {
            shell: true,
            ...options,
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', data => {
            const chunk = data.toString()
            stdout += chunk
            process.stdout.write(chunk)
        })

        child.stderr?.on('data', data => {
            const chunk = data.toString()
            stderr += chunk
            process.stderr.write(chunk)
        })

        child.on('error', reject)
        child.on('close', code => {
            if (code === 0) {
                resolve({ stdout, stderr })
            }
            else {
                const error = new Error(`Process exited with code ${code}`)
                Object.assign(error, { stdout, stderr, exitCode: code })
                reject(error)
            }
        })
    })
}