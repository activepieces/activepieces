export type CodeSandbox = {
    run(params: RunParams): Promise<unknown>
}

type RunParams = {
    codeModule: CodeModule
    inputs: Record<string, unknown>
}

export type CodeModule = {
    code(input: unknown): Promise<unknown>
}
