import { ApId } from '../../common/id-generator'
import { PlatformId } from '../../platform'
import { ProjectId } from '../../project/project'
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
}

export type EnginePrincipal = {
    id: ApId
    type: PrincipalType.ENGINE
    projectId: ProjectId
    platform: {
        id: PlatformId
    }
}