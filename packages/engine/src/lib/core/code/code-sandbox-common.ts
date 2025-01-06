import { CodeV2Module } from './code-v2'

export type CodeModule = {
    code(input: unknown): Promise<unknown>
}

export type CodeSandbox = {
    /**
     * Executes a {@link CodeModule}.
     */
    runCodeModule<T extends CodeModule | CodeV2Module>(params: RunCodeModuleParams<T>): Promise<unknown>

    /**
     * Executes a script.
     */
    runScript(params: RunScriptParams): Promise<unknown>
}

export function isCodeV2Module(module: CodeModule | CodeV2Module): module is CodeV2Module {
    return 'code' in module && 'run' in module.code
}

type RunCodeModuleParams<T extends CodeModule | CodeV2Module> = {
    /**
     * The {@link CodeModule} to execute.
     */
    codeModule: T

    /**
     * The inputs that are passed to the {@link CodeModule}.
     */
    inputs: Record<string, unknown>
}

type RunScriptParams = {
    /**
     * A serialized script that will be executed in the sandbox.
     * The script can either be sync or async.
     */
    script: string

    /**
     * A key-value map of variables available to the script during execution.
     */
    scriptContext: Record<string, unknown>
}
