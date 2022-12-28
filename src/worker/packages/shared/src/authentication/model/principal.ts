import { ApId } from '../../common/id-generator';
import { PrincipalType } from './principal-type';
import {CollectionId} from "../../collections/collection";

export type Principal = WorkerPrincipal | UserPrincipal;

export interface UserPrincipal extends BasePrincipal<PrincipalType.USER>{

}

export interface WorkerPrincipal extends BasePrincipal<PrincipalType.WORKER>{
    collectionId: CollectionId;
}

interface BasePrincipal<T>{
    id: ApId,
    type: T
}
