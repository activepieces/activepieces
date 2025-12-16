import { ApId } from '../../common/id-generator'
import { PlatformId } from '../../platform'
import { ProjectId } from '../../project'
import { PrincipalType } from './principal-type'

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
    projectId: ProjectId
    platform: {
        id: ApId
    }
}

export type UserPrincipal = {
    id: ApId
    type: PrincipalType.USER
    projectId: ProjectId
    platform: {
        id: ApId
    }
    tokenVersion?: string
}

export type EnginePrincipal = {
    id: ApId
    type: PrincipalType.ENGINE
    projectId: ProjectId
    platform: {
        id: PlatformId
    }
}


export type PrincipalForType<T extends PrincipalType> = Extract<Principal, { type: T }>

export type PrincipalForTypes<R extends readonly PrincipalType[]> = PrincipalForType<R[number]>

export type Principal =
    | WorkerPrincipal
    | AnnonymousPrincipal
    | ServicePrincipal
    | UserPrincipal
    | EnginePrincipal


// TODO(@Chaker): This is a temporary v2 types without projectId

export type ServicePrincipalV2 = {
    id: ApId
    type: PrincipalType.SERVICE
    platform: {
        id: ApId
    }
}

export type UserPrincipalV2 = {
    id: ApId
    type: PrincipalType.USER
    platform: {
        id: ApId
    }
    tokenVersion?: string
}

export type EnginePrincipalV2 = {
    id: ApId
    type: PrincipalType.ENGINE
    platform: {
        id: PlatformId
    }
}

export type PrincipalForTypeV2<T extends PrincipalType> = Extract<PrincipalV2, { type: T }>

export type PrincipalForTypesV2<R extends readonly PrincipalType[]> = PrincipalForTypeV2<R[number]>

export type PrincipalV2 =
    | WorkerPrincipal
    | AnnonymousPrincipal
    | ServicePrincipalV2
    | UserPrincipalV2
    | EnginePrincipalV2