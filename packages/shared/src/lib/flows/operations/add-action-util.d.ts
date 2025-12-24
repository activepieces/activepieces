import { FlowAction } from '../actions/action';
import { FlowVersion } from '../flow-version';
declare function mapToNewNames(flowVersion: FlowVersion, clonedActions: FlowAction[]): Record<string, string>;
declare function clone(step: FlowAction, oldNameToNewName: Record<string, string>): FlowAction;
export declare const addActionUtils: {
    mapToNewNames: typeof mapToNewNames;
    clone: typeof clone;
};
export {};
