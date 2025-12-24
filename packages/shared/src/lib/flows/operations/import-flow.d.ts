import { FlowAction } from '../actions/action';
import { FlowVersion } from '../flow-version';
import { FlowTrigger } from '../triggers/trigger';
import { FlowOperationRequest, ImportFlowRequest } from './index';
declare function _getImportOperations(step: FlowAction | FlowTrigger | undefined): FlowOperationRequest[];
declare function _importFlow(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[];
export { _importFlow, _getImportOperations };
