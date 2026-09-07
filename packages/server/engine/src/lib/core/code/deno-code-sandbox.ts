import { readFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { deno, DenoPermission } from '@activepieces/core-utils'
import { CodeSandbox } from './code-sandbox-common'

export { DenoPermission } from '@activepieces/core-utils'

export function denoCodeSandbox(permissions: DenoPermission[]): CodeSandbox {
    const sandbox: CodeSandbox = {
        async runCodeModule({ codeFilePath, inputs }) {
            // Deno compares permission paths after resolving symlinks (e.g. macOS
            // /var -> /private/var), so the grant must be on the real path.
            const stepDir = await realpath(dirname(codeFilePath))
            const source = await readFile(codeFilePath, 'utf8')

            return deno.run({
                body: `
    const { createRequire } = await import('node:module');
    const require = createRequire(${JSON.stringify(pathToFileURL(codeFilePath).href)});
    const module = { exports: Object.create(null) };
    new Function('exports', 'module', 'require', ${JSON.stringify(source)})(module.exports, module, require);
    const result = await module.exports.code(${JSON.stringify(inputs)});
`,
                permissions,
                cwd: stepDir,
            })
        },

        async runScript({ script, scriptContext, functions }) {
            const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')

            return deno.run({
                body: `
    Object.assign(globalThis, ${JSON.stringify(scriptContext)});
    const result = await (0, eval)(${JSON.stringify(`${serializedFunctions}\n(${script})`)});
`,
                permissions: [],
                cwd: tmpdir(),
            })
        },

        async createScriptSession({ scriptContext, functions }) {
            const context: Record<string, unknown> = { ...scriptContext }
            let disposed = false
            return {
                run: async (script: string) => {
                    if (disposed) {
                        throw new Error('Script session has been disposed')
                    }
                    return sandbox.runScript({ script, scriptContext: context, functions })
                },
                setGlobal: async (key: string, value: unknown, noOverwrite = true) => {
                    if (noOverwrite && (key in context || key in functions)) {
                        return
                    }
                    context[key] = value
                },
                dispose: () => {
                    disposed = true
                },
            }
        },
    }
    return sandbox
}
