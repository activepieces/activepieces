export type CodeModule = {
    code(input: unknown): Promise<unknown>
}

export type CodeExecutorSandbox = {
    run(params: RunParams): Promise<unknown>
}

type RunParams = {
    codeModule: CodeModule
    input: Record<string, unknown>
}
