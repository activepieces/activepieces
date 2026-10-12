import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createIssueAction } from './lib/actions/create-issue-action';
import { addIssueSpentTimeAction } from './lib/actions/issues/add-issue-spent-time';
import { createIssueNoteAction } from './lib/actions/issues/create-issue-note';
import { createProjectIssueAction } from './lib/actions/issues/create-project-issue';
import { deleteIssueNoteAction } from './lib/actions/issues/delete-issue-note';
import { getIssueNoteAction } from './lib/actions/issues/get-issue-note';
import { getIssueTimeStatsAction } from './lib/actions/issues/get-issue-time-stats';
import { getIssueAction } from './lib/actions/issues/get-issue';
import { listIssueNotesAction } from './lib/actions/issues/list-issue-notes';
import { listIssuesAction } from './lib/actions/issues/list-issues';
import { moveIssueAction } from './lib/actions/issues/move-issue';
import { resetIssueSpentTimeAction } from './lib/actions/issues/reset-issue-spent-time';
import { resetIssueTimeEstimateAction } from './lib/actions/issues/reset-issue-time-estimate';
import { setIssueTimeEstimateAction } from './lib/actions/issues/set-issue-time-estimate';
import { updateIssueNoteAction } from './lib/actions/issues/update-issue-note';
import { updateIssueAction } from './lib/actions/issues/update-issue';
import { approveMergeRequestAction } from './lib/actions/merge-requests/approve-merge-request';
import { createMergeRequestDraftNoteAction } from './lib/actions/merge-requests/create-merge-request-draft-note';
import { createMergeRequestAction } from './lib/actions/merge-requests/create-merge-request';
import { deleteMergeRequestAction } from './lib/actions/merge-requests/delete-merge-request';
import { getMergeRequestApprovalsAction } from './lib/actions/merge-requests/get-merge-request-approvals';
import { getMergeRequestAction } from './lib/actions/merge-requests/get-merge-request';
import { listMergeRequestCommitsAction } from './lib/actions/merge-requests/list-merge-request-commits';
import { listMergeRequestDiffVersionsAction } from './lib/actions/merge-requests/list-merge-request-diff-versions';
import { listMergeRequestDiffsAction } from './lib/actions/merge-requests/list-merge-request-diffs';
import { listMergeRequestDiscussionsAction } from './lib/actions/merge-requests/list-merge-request-discussions';
import { listMergeRequestNotesAction } from './lib/actions/merge-requests/list-merge-request-notes';
import { listMergeRequestsAction } from './lib/actions/merge-requests/list-merge-requests';
import { mergeMergeRequestAction } from './lib/actions/merge-requests/merge-merge-request';
import { unapproveMergeRequestAction } from './lib/actions/merge-requests/unapprove-merge-request';
import { updateMergeRequestAction } from './lib/actions/merge-requests/update-merge-request';
import { createBranchAction } from './lib/actions/repository/create-branch';
import { createCommitCommentAction } from './lib/actions/repository/create-commit-comment';
import { createCommitAction } from './lib/actions/repository/create-commit';
import { createFileAction } from './lib/actions/repository/create-file';
import { deleteBranchAction } from './lib/actions/repository/delete-branch';
import { deleteFileAction } from './lib/actions/repository/delete-file';
import { getBranchAction } from './lib/actions/repository/get-branch';
import { getCommitRefsAction } from './lib/actions/repository/get-commit-refs';
import { getCommitSequenceAction } from './lib/actions/repository/get-commit-sequence';
import { getCommitAction } from './lib/actions/repository/get-commit';
import { getFileAction } from './lib/actions/repository/get-file';
import { listBranchesAction } from './lib/actions/repository/list-branches';
import { listCommitCommentsAction } from './lib/actions/repository/list-commit-comments';
import { listCommitsAction } from './lib/actions/repository/list-commits';
import { listRepositoryTreeAction } from './lib/actions/repository/list-repository-tree';
import { listTagsAction } from './lib/actions/repository/list-tags';
import { protectBranchAction } from './lib/actions/repository/protect-branch';
import { unprotectBranchAction } from './lib/actions/repository/unprotect-branch';
import { updateFileAction } from './lib/actions/repository/update-file';
import { getCurrentUserAction } from './lib/actions/users/get-current-user';
import { getUserStatusAction } from './lib/actions/users/get-user-status';
import { getUserAction } from './lib/actions/users/get-user';
import { listUsersAction } from './lib/actions/users/list-users';
import { setUserStatusAction } from './lib/actions/users/set-user-status';
import { issuesEventTrigger } from './lib/trigger/issue-event';
import { gitlabAuth } from './lib/auth';
import { GITLAB_API_BASE } from './lib/common/constants';

export const gitlab = createPiece({
  displayName: 'GitLab',
  description: 'Collaboration tool for developers',

  auth: gitlabAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/gitlab.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  actions: [
    createIssueAction,
    addIssueSpentTimeAction,
    createIssueNoteAction,
    createProjectIssueAction,
    deleteIssueNoteAction,
    getIssueNoteAction,
    getIssueTimeStatsAction,
    getIssueAction,
    listIssueNotesAction,
    listIssuesAction,
    moveIssueAction,
    resetIssueSpentTimeAction,
    resetIssueTimeEstimateAction,
    setIssueTimeEstimateAction,
    updateIssueNoteAction,
    updateIssueAction,
    approveMergeRequestAction,
    createMergeRequestDraftNoteAction,
    createMergeRequestAction,
    deleteMergeRequestAction,
    getMergeRequestApprovalsAction,
    getMergeRequestAction,
    listMergeRequestCommitsAction,
    listMergeRequestDiffVersionsAction,
    listMergeRequestDiffsAction,
    listMergeRequestDiscussionsAction,
    listMergeRequestNotesAction,
    listMergeRequestsAction,
    mergeMergeRequestAction,
    unapproveMergeRequestAction,
    updateMergeRequestAction,
    createBranchAction,
    createCommitCommentAction,
    createCommitAction,
    createFileAction,
    deleteBranchAction,
    deleteFileAction,
    getBranchAction,
    getCommitRefsAction,
    getCommitSequenceAction,
    getCommitAction,
    getFileAction,
    listBranchesAction,
    listCommitCommentsAction,
    listCommitsAction,
    listRepositoryTreeAction,
    listTagsAction,
    protectBranchAction,
    unprotectBranchAction,
    updateFileAction,
    getCurrentUserAction,
    getUserStatusAction,
    getUserAction,
    listUsersAction,
    setUserStatusAction,
    createCustomApiCallAction({
      baseUrl: () => GITLAB_API_BASE,
      auth: gitlabAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [issuesEventTrigger],
});
