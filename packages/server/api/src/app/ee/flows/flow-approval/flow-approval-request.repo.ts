import { repoFactory } from '../../../core/db/repo-factory'
import { FlowApprovalRequestEntity } from './flow-approval-request.entity'

export const flowApprovalRequestRepo = repoFactory(FlowApprovalRequestEntity)
