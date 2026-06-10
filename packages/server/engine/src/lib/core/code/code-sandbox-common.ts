export type CodeModule = {
    code(input: unknown): Promise<unknown>
}

export type CodeSandbox = {
    /**
     * Executes a {@link CodeModule}.
     */
    runCodeModule(params: RunCodeModuleParams): Promise<unknown>

    /**
     * Executes a script.
     */
    runScript(params: RunScriptParams): Promise<unknown>
}

type RunCodeModuleParams = {
    /**
     * Path to the compiled index.js file to execute.
     */
    codeFilePath: string

    /**
     * The inputs that are passed to the code module.
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
