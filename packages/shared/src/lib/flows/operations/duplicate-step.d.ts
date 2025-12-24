import { FlowVersion } from '../flow-version';
import { FlowOperationRequest } from '.';
declare function _duplicateStep(stepName: string, flowVersion: FlowVersion): FlowOperationRequest[];
declare function _duplicateBranch(routerName: string, childIndex: number, flowVersion: FlowVersion): FlowOperationRequest[];
export { _duplicateStep, _duplicateBranch };
