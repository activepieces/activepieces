import { ApId } from '../../common/id-generator'
import { PlatformId } from '../../platform'
import { ProjectId } from '../../project/project'
import { WorkerMachineType } from '../../workers'
import { PrincipalType } from './principal-type'

export type Principal = {
    id: ApId
    type: PrincipalType
    projectId: ProjectId
    platform: {
        id: ApId
    }
    tokenVersion?: string
}

export type WorkerPrincipal = {
    id: ApId
    type: PrincipalType.WORKER
    platform: {
        id: ApId
    } | null
    worker: {
        type: WorkerMachineType
    }
}

export type EnginePrincipal = {
    id: ApId
    type: PrincipalType.ENGINE
    queueToken: string | undefined
    projectId: ProjectId | undefined
    platform: {
        id: PlatformId
    }
}