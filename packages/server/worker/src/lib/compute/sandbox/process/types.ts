import { ChildProcess } from 'child_process'

export type ProcessMaker = {
    create: (params: CreateProcessParams) => Promise<ChildProcess>
}

export type CreateProcessParams = {
    env: Record<string, string>
    memoryLimitMb: number
    sandboxId: string
    flowVersionId: string | undefined
    platformId: string
    reusable: boolean
}

