import { ChildProcess } from 'child_process'


export type EngineProcess = {
    create: (params: CreateEngineParams) => Promise<ChildProcess>
}

export type EngineProcessOptions =  {
    env: Record<string, string | undefined>
    resourceLimits: {
        maxOldGenerationSizeMb: number
        maxYoungGenerationSizeMb: number
        stackSizeMb: number
    }
    execArgv: string[]
}

type CreateEngineParams = {
    workerId: string
    workerIndex: number
    customPiecesPath: string
    flowVersionId: string | undefined
    options: EngineProcessOptions
}