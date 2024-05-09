import { FlowRunStatus } from './execution/flow-execution'

export const getFlowState = (status: FlowRunStatus): boolean => {
    return status === FlowRunStatus.SUCCEEDED || status === FlowRunStatus.FAILED || status === FlowRunStatus.INTERNAL_ERROR || status === FlowRunStatus.QUOTA_EXCEEDED
}