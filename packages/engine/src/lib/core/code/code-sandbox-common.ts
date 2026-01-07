export type CodeModule = {
    code(input: unknown): Promise<unknown>
}

export type CodeSandbox = {
    /**
     * Executes a {@link CodeModule}.
     */
    runCodeModule(params: RunCodeModuleParams): Promise<unknown>

    /**
     * Executes a bundled code string that exposes a `code` function.
     * The bundle should be in IIFE format with `code` assigned to globalThis.
     */
    runBundle(params: RunBundleParams): Promise<unknown>

    /**
     * Executes a script.
     */
    runScript(params: RunScriptParams): Promise<unknown>
}

type RunCodeModuleParams = {
    /**
     * The {@link CodeModule} to execute.
     */
    codeModule: CodeModule

    /**
     * The inputs that are passed to the {@link CodeModule}.
     */
    inputs: Record<string, unknown>
}

type RunBundleParams = {
    /**
     * The bundled code string (IIFE format with globalThis.code = ...)
     */
    bundleCode: string

    /**
     * The inputs that are passed to the code function.
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

    /**
     * A key-value map of functions that are available to the script during execution.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    functions: Record<string, Function>

}
