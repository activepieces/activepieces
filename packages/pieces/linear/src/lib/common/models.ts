import { LinearDocument } from '@linear/sdk';

export interface createIssuePayload extends LinearDocument.IssueCreateInput {}
export interface updateIssuePayload extends LinearDocument.IssueUpdateInput {}
export interface listTeamsQueryVariables
  extends LinearDocument.TeamsQueryVariables {}

export interface listWorkflowStatesQueryVariables
  extends LinearDocument.WorkflowStatesQueryVariables {}

export interface listIssuesQueryVaribles
  extends LinearDocument.IssuesQueryVariables {}

export const updatedAt = LinearDocument.PaginationOrderBy.UpdatedAt;
export const createdAt = LinearDocument.PaginationOrderBy.CreatedAt;
