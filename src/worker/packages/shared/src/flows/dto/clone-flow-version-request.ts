import {Trigger} from "../triggers/trigger";

export interface CloneFlowVersionRequest {
    displayName: string;
    trigger: Trigger,
    valid: boolean
}