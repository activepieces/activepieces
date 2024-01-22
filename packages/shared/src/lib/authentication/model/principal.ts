import { ApId } from '../../common/id-generator'
import { PlatformRole, PrincipalType } from './principal-type'
import { ProjectId } from '../../project/project'

export type Principal = {
    id: ApId
    type: PrincipalType
    projectId: ProjectId
    platform: {
        id: ApId
        role: PlatformRole
    }
}
