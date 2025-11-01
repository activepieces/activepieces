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

export type AnnonymousPrincipal = {
    id: ApId
    type: PrincipalType.UNKNOWN
}

export type ServicePrincipal = {
    id: ApId
    type: PrincipalType.SERVICE
    platform: {
        id: ApId
    }
}

export type UserPrincipal = {
    id: ApId
    type: PrincipalType.USER
    platform: {
        id: ApId
    }
}

export type EnginePrincipal = {
    id: ApId
    type: PrincipalType.ENGINE
    platform: {
        id: PlatformId
    }
}