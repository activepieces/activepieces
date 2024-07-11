import { ApId } from '../../common/id-generator'
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