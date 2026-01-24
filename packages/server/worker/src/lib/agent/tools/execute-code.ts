import { Tool, tool } from 'ai'
import { z } from 'zod'
import type { CommandResult, Sandbox, Execution } from '@e2b/code-interpreter'
import { assertNotNullOrUndefined } from '@activepieces/shared'

export const EXECUTE_CODE_TOOL_NAME = 'execute_code'

const description = `
Execute code in a secure sandboxed environment. Use this tool for:
    - Running Python, JavaScript, or bash commands
    - Testing code snippets
    - Performing calculations or data processing
    - Installing and using packages
    - File operations in the sandbox
The sandbox provides a clean, isolated environment that resets after execution.
`

export async function createExecuteCodeTool(apiKey: string | undefined): Promise<Record<string, Tool>> {
    const e2bLib = await import("@e2b/code-interpreter")
    assertNotNullOrUndefined(apiKey, 'E2B API key is required')
    return {
        [EXECUTE_CODE_TOOL_NAME]: tool({
            description,
            inputSchema: z.object({
                language: z
                    .enum(['python', 'javascript', 'bash'])
                    .describe('Programming language to execute'),
                code: z
                    .string()
                    .describe('The code to execute in the sandbox')
            }),
            execute: async ({ language, code }) => {
                let sandbox: Sandbox | null = null

                try {
                    sandbox = await e2bLib.Sandbox.create({ apiKey })

                    let execution
                    switch (language) {
                        case 'python':
                            execution = await sandbox.runCode(code)
                            break
                        case 'javascript':
                            execution = await sandbox.runCode(code, {
                                language: 'js'
                            })
                            break
                        case 'bash':
                            execution = await sandbox.commands.run(code)
                            break
                        default:
                            throw new Error(`Unsupported language: ${language}`)
                    }

                    const isBashResult = 'exitCode' in execution

                    let result
                    if (isBashResult) {
                        const cmdResult = execution as CommandResult
                        result = {
                            success: cmdResult.exitCode === 0,
                            stdout: cmdResult.stdout || '',
                            stderr: cmdResult.stderr || '',
                            exitCode: cmdResult.exitCode,
                            error: cmdResult.exitCode !== 0 ? cmdResult.stderr : undefined,
                        }
                    } else {
                        const execResult = execution as Execution
                        result = {
                            success: !execResult.error,
                            stdout: execResult.logs?.stdout?.join('\n') || '',
                            stderr: execResult.logs?.stderr?.join('\n') || '',
                            error: execResult.error?.value || execResult.error?.name,
                            results: execResult.results || [],
                        }
                    }

                    return {
                        message: `Code executed successfully in ${language}.\n\n` +
                            `${result.stdout ? `Output:\n${result.stdout}\n` : ''}` +
                            `${result.stderr ? `Errors:\n${result.stderr}\n` : ''}` +
                            `${"results" in result && result.results.length > 0 ? `Results: ${JSON.stringify(result.results)}\n` : ''}`,
                        ...result
                    }
                } catch (error) {
                    return {
                        success: false,
                        message: `Code execution failed: ${error instanceof Error ? error.message : String(error)}`,
                        error: String(error)
                    }
                } finally {
                    if (sandbox) {
                        await sandbox.kill()
                    }
                }
            },
        })
    }
}

export const CODE_EXECUTION_SYSTEM_PROMPT = `
## \`${EXECUTE_CODE_TOOL_NAME}\` (code execution)
You have access to an \`${EXECUTE_CODE_TOOL_NAME}\` tool to execute code in a secure sandbox.

### When to Use This Tool
Use for:
1. Testing or running code snippets
2. Performing calculations or data analysis
3. Installing packages and running scripts
4. File operations or data transformations
5. Validating code before suggesting to user

### Supported Languages
- **Python**: Full Python 3 environment with pip
- **JavaScript**: Node.js environment with npm
- **Bash**: Shell commands and scripts

### Best Practices
1. Always validate code before execution
2. Handle errors gracefully
3. Use appropriate timeouts for long-running code
4. Clean output for user readability
5. Consider security - never execute untrusted user input directly

### Example Usage
- Data analysis with pandas
- Running tests
- File manipulation
- API calls
- Mathematical computations
`