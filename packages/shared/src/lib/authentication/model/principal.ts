import { ApId } from '../../common/id-generator';
import { PrincipalType } from './principal-type';
import { ProjectId } from '../../project/project';

export type Principal = WorkerPrincipal | UserPrincipal;

export interface UserPrincipal extends BasePrincipal<PrincipalType.USER>{
    projectId: ProjectId;
}

export interface WorkerPrincipal extends BasePrincipal<PrincipalType.WORKER>{
    projectId: ProjectId;
}

interface BasePrincipal<T>{
    id: ApId,
    type: T
}
