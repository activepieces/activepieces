import { FlowRunStatus } from './execution/flow-execution'

export const isFlowStateTerminal = (status: FlowRunStatus): boolean => {
    return status === FlowRunStatus.SUCCEEDED || status === FlowRunStatus.FAILED || status === FlowRunStatus.INTERNAL_ERROR || status === FlowRunStatus.QUOTA_EXCEEDED
}