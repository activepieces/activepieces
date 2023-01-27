import { ApId } from '../../common/id-generator';
import { PrincipalType } from './principal-type';
import {CollectionId} from "../../collections/collection";
import { ProjectId } from '../../project/project';

export type Principal = WorkerPrincipal | UserPrincipal;

export interface UserPrincipal extends BasePrincipal<PrincipalType.USER>{
    projectId: ProjectId;
}

export interface WorkerPrincipal extends BasePrincipal<PrincipalType.WORKER>{
    collectionId: CollectionId;
    projectId: ProjectId;
}

interface BasePrincipal<T>{
    id: ApId,
    type: T
}
