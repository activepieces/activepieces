export type CodeSandbox = {
    run(params: RunParams): Promise<unknown>
}

type RunParams = {
    /**
     * A serialized function that will be executed in the sandbox.
     * The function can either be sync or async.
     */
    code: string

    /**
     * A key-value map of variables available to code during execution.
     */
    codeContext: Record<string, unknown>
}
