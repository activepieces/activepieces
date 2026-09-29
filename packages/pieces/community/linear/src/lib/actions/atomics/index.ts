import { linearIssueCreateAtomic } from './issue-create';
import { linearIssueUpdateAtomic } from './issue-update';
import { linearIssueGetAtomic } from './issue-get';
import { linearIssuesListAtomic } from './issues-list';
import { linearIssuesSearchAtomic } from './issues-search';
import { linearIssueArchiveAtomic } from './issue-archive';
import { linearIssueUnarchiveAtomic } from './issue-unarchive';
import { linearIssueDeleteAtomic } from './issue-delete';
import { linearIssueRelationCreateAtomic } from './issue-relation-create';
import { linearIssueAddLabelAtomic } from './issue-add-label';
import { linearIssueRemoveLabelAtomic } from './issue-remove-label';
import { linearIssueLabelCreateAtomic } from './issue-label-create';
import { linearIssueLabelsListAtomic } from './issue-labels-list';
import { linearWorkflowStatesListAtomic } from './workflow-states-list';
import { linearTeamsListAtomic } from './teams-list';
import { linearTeamGetAtomic } from './team-get';
import { linearTeamUpdateAtomic } from './team-update';
import { linearUsersListAtomic } from './users-list';
import { linearViewerGetAtomic } from './viewer-get';
import { linearCyclesListAtomic } from './cycles-list';
import { linearCommentCreateAtomic } from './comment-create';
import { linearCommentGetAtomic } from './comment-get';
import { linearCommentsListAtomic } from './comments-list';
import { linearCommentUpdateAtomic } from './comment-update';
import { linearCommentResolveAtomic } from './comment-resolve';
import { linearCommentUnresolveAtomic } from './comment-unresolve';
import { linearCommentReactionCreateAtomic } from './comment-reaction-create';
import { linearReactionDeleteAtomic } from './reaction-delete';
import { linearAttachmentCreateAtomic } from './attachment-create';
import { linearAttachmentGetAtomic } from './attachment-get';
import { linearUploadDownloadAtomic } from './upload-download';
import { linearProjectCreateAtomic } from './project-create';
import { linearProjectUpdateAtomic } from './project-update';
import { linearProjectsListAtomic } from './projects-list';
import { linearProjectGetAtomic } from './project-get';
import { linearProjectDeleteAtomic } from './project-delete';
import { linearProjectUnarchiveAtomic } from './project-unarchive';
import { linearProjectMilestoneCreateAtomic } from './project-milestone-create';
import { linearProjectStatusUpdateCreateAtomic } from './project-status-update-create';
import { linearProjectStatusUpdateGetAtomic } from './project-status-update-get';
import { linearProjectStatusUpdatesListAtomic } from './project-status-updates-list';
import { linearProjectStatusUpdateEditAtomic } from './project-status-update-edit';
import { linearProjectStatusUpdateArchiveAtomic } from './project-status-update-archive';
import { linearProjectStatusUpdateUnarchiveAtomic } from './project-status-update-unarchive';

export const linearAtomics = [
  linearIssueCreateAtomic,
  linearIssueUpdateAtomic,
  linearIssueGetAtomic,
  linearIssuesListAtomic,
  linearIssuesSearchAtomic,
  linearIssueArchiveAtomic,
  linearIssueUnarchiveAtomic,
  linearIssueDeleteAtomic,
  linearIssueRelationCreateAtomic,
  linearIssueAddLabelAtomic,
  linearIssueRemoveLabelAtomic,
  linearIssueLabelCreateAtomic,
  linearIssueLabelsListAtomic,
  linearWorkflowStatesListAtomic,
  linearTeamsListAtomic,
  linearTeamGetAtomic,
  linearTeamUpdateAtomic,
  linearUsersListAtomic,
  linearViewerGetAtomic,
  linearCyclesListAtomic,
  linearCommentCreateAtomic,
  linearCommentGetAtomic,
  linearCommentsListAtomic,
  linearCommentUpdateAtomic,
  linearCommentResolveAtomic,
  linearCommentUnresolveAtomic,
  linearCommentReactionCreateAtomic,
  linearReactionDeleteAtomic,
  linearAttachmentCreateAtomic,
  linearAttachmentGetAtomic,
  linearUploadDownloadAtomic,
  linearProjectCreateAtomic,
  linearProjectUpdateAtomic,
  linearProjectsListAtomic,
  linearProjectGetAtomic,
  linearProjectDeleteAtomic,
  linearProjectUnarchiveAtomic,
  linearProjectMilestoneCreateAtomic,
  linearProjectStatusUpdateCreateAtomic,
  linearProjectStatusUpdateGetAtomic,
  linearProjectStatusUpdatesListAtomic,
  linearProjectStatusUpdateEditAtomic,
  linearProjectStatusUpdateArchiveAtomic,
  linearProjectStatusUpdateUnarchiveAtomic,
];
