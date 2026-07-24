import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { githubAuthHelpers, GithubAuthValue } from './lib/common/auth-helpers';
import { githubCreateIssueAction } from './lib/actions/create-issue';
import { githubUnlockIssueAction } from './lib/actions/unlock-issue';
import { githubTriggers } from './lib/trigger';
import { githubGetIssueInformation } from './lib/actions/get-issue-information';
import { githubCreateCommentOnAIssue } from './lib/actions/create-comment-on-a-issue';
import { githubLockIssueAction } from './lib/actions/lock-issue';
import { githubRawGraphqlQuery } from './lib/actions/raw-graphql-query';
import { githubCreatePullRequestReviewCommentAction } from './lib/actions/create-pull-request-review-comment';
import { githubCreateCommitCommentAction } from './lib/actions/create-commit-comment';
import { githubCreateDiscussionCommentAction } from './lib/actions/create-discussion-comment';
import { githubAddLabelsToIssueAction } from './lib/actions/add-labels-to-issue';
import { githubCreateBranchAction } from './lib/actions/create-branch';
import { githubDeleteBranchAction } from './lib/actions/delete-branch';
import { githubUpdateIssueAction } from './lib/actions/update-issue';
import { githubCreateGistAction } from './lib/actions/create-gist';

import { githubFindBranchAction } from './lib/actions/find-branch';
import { githubFindIssueAction } from './lib/actions/find-issue';
import { githubFindUserAction } from './lib/actions/find-user';

// AI agent atomics (audience: 'ai') — flat owner/repo props, resolver-friendly descriptions.
import { githubCreateIssueAiAction } from './lib/actions/ai/create-issue-ai';
import { githubGetIssueAiAction } from './lib/actions/ai/get-issue-ai';
import { githubListRepositoryIssuesAction } from './lib/actions/ai/list-repository-issues';
import { githubUpdateIssueAiAction } from './lib/actions/ai/update-issue-ai';
import { githubCreateIssueCommentAiAction } from './lib/actions/ai/create-issue-comment-ai';
import { githubListIssueCommentsAction } from './lib/actions/ai/list-issue-comments';
import { githubLockIssueAiAction } from './lib/actions/ai/lock-issue-ai';
import { githubUnlockIssueAiAction } from './lib/actions/ai/unlock-issue-ai';
import { githubAddLabelsToIssueAiAction } from './lib/actions/ai/add-labels-to-issue-ai';
import { githubRemoveLabelFromIssueAction } from './lib/actions/ai/remove-label-from-issue';
import { githubSetIssueLabelsAction } from './lib/actions/ai/set-issue-labels';
import { githubListIssueLabelsAction } from './lib/actions/ai/list-issue-labels';
import { githubAddAssigneesToIssueAction } from './lib/actions/ai/add-assignees-to-issue';
import { githubRemoveAssigneesFromIssueAction } from './lib/actions/ai/remove-assignees-from-issue';
import { githubListAssigneesAction } from './lib/actions/ai/list-assignees';
import { githubListRepositoryLabelsAction } from './lib/actions/ai/list-repository-labels';
import { githubCreateLabelAction } from './lib/actions/ai/create-label';
import { githubUpdateLabelAction } from './lib/actions/ai/update-label';
import { githubCreatePullRequestAction } from './lib/actions/ai/create-pull-request';
import { githubGetPullRequestAction } from './lib/actions/ai/get-pull-request';
import { githubListPullRequestsAction } from './lib/actions/ai/list-pull-requests';
import { githubUpdatePullRequestAction } from './lib/actions/ai/update-pull-request';
import { githubMergePullRequestAction } from './lib/actions/ai/merge-pull-request';
import { githubListPullRequestFilesAction } from './lib/actions/ai/list-pull-request-files';
import { githubListPullRequestCommitsAction } from './lib/actions/ai/list-pull-request-commits';
import { githubCreatePullRequestReviewAction } from './lib/actions/ai/create-pull-request-review';
import { githubRequestPullRequestReviewersAction } from './lib/actions/ai/request-pull-request-reviewers';
import { githubCreatePullRequestReviewCommentAiAction } from './lib/actions/ai/create-pull-request-review-comment-ai';
import { githubListPullRequestReviewCommentsAction } from './lib/actions/ai/list-pull-request-review-comments';
import { githubListPullRequestReviewsAction } from './lib/actions/ai/list-pull-request-reviews';
import { githubGetRepositoryAction } from './lib/actions/ai/get-repository';
import { githubListMyRepositoriesAction } from './lib/actions/ai/list-my-repositories';
import { githubListUserRepositoriesAction } from './lib/actions/ai/list-user-repositories';
import { githubListOrganizationRepositoriesAction } from './lib/actions/ai/list-organization-repositories';
import { githubCreateRepositoryAction } from './lib/actions/ai/create-repository';
import { githubCreateOrganizationRepositoryAction } from './lib/actions/ai/create-organization-repository';
import { githubUpdateRepositoryAction } from './lib/actions/ai/update-repository';
import { githubListBranchesAction } from './lib/actions/ai/list-branches';
import { githubGetBranchAction } from './lib/actions/ai/get-branch';
import { githubListCommitsAction } from './lib/actions/ai/list-commits';
import { githubGetCommitAction } from './lib/actions/ai/get-commit';
import { githubCompareCommitsAction } from './lib/actions/ai/compare-commits';
import { githubListContributorsAction } from './lib/actions/ai/list-contributors';
import { githubListLanguagesAction } from './lib/actions/ai/list-languages';
import { githubListTagsAction } from './lib/actions/ai/list-tags';
import { githubGetFileContentAction } from './lib/actions/ai/get-file-content';
import { githubCreateOrUpdateFileAction } from './lib/actions/ai/create-or-update-file';
import { githubDeleteFileAction } from './lib/actions/ai/delete-file';
import { githubGetRepositoryTreeAction } from './lib/actions/ai/get-repository-tree';
import { githubCreateBranchAiAction } from './lib/actions/ai/create-branch-ai';
import { githubGetReferenceAction } from './lib/actions/ai/get-reference';
import { githubDeleteBranchAiAction } from './lib/actions/ai/delete-branch-ai';
import { githubSearchRepositoriesAction } from './lib/actions/ai/search-repositories';
import { githubSearchIssuesAndPullRequestsAction } from './lib/actions/ai/search-issues-and-pull-requests';
import { githubSearchCodeAction } from './lib/actions/ai/search-code';
import { githubSearchUsersAction } from './lib/actions/ai/search-users';
import { githubGetAuthenticatedUserAction } from './lib/actions/ai/get-authenticated-user';
import { githubGetUserAction } from './lib/actions/ai/get-user';
import { githubListOrganizationMembersAction } from './lib/actions/ai/list-organization-members';
import { githubCreateReleaseAction } from './lib/actions/ai/create-release';
import { githubListReleasesAction } from './lib/actions/ai/list-releases';
import { githubGetReleaseAction } from './lib/actions/ai/get-release';
import { githubGetLatestReleaseAction } from './lib/actions/ai/get-latest-release';
import { githubListCollaboratorsAction } from './lib/actions/ai/list-collaborators';
import { githubAddCollaboratorAction } from './lib/actions/ai/add-collaborator';
import { githubRemoveCollaboratorAction } from './lib/actions/ai/remove-collaborator';
import { githubCreateMilestoneAction } from './lib/actions/ai/create-milestone';
import { githubListMilestonesAction } from './lib/actions/ai/list-milestones';
import { githubGetMilestoneAction } from './lib/actions/ai/get-milestone';
import { githubUpdateMilestoneAction } from './lib/actions/ai/update-milestone';
import { githubStarRepositoryAction } from './lib/actions/ai/star-repository';
import { githubUnstarRepositoryAction } from './lib/actions/ai/unstar-repository';
import { githubListStarredRepositoriesAction } from './lib/actions/ai/list-starred-repositories';
import { githubCheckRepositoryStarredAction } from './lib/actions/ai/check-repository-starred';

import { githubAuth } from './lib/auth';

export const github = createPiece({
  displayName: 'GitHub',
  description:
    'Developer platform that allows developers to create, store, manage and share their code',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: githubAuth,
  actions: [
    githubCreateIssueAction,
    githubGetIssueInformation,
    githubCreateCommentOnAIssue,
    githubLockIssueAction,
    githubUnlockIssueAction,
    githubRawGraphqlQuery,
    githubCreatePullRequestReviewCommentAction,
    githubCreateCommitCommentAction,
    githubCreateDiscussionCommentAction,
    githubAddLabelsToIssueAction,
    githubCreateBranchAction,
    githubDeleteBranchAction,
    githubUpdateIssueAction,
    githubFindBranchAction,
    githubFindIssueAction,
    githubFindUserAction,
    githubCreateGistAction,
    // AI agent atomics (audience: 'ai')
    githubCreateIssueAiAction,
    githubGetIssueAiAction,
    githubListRepositoryIssuesAction,
    githubUpdateIssueAiAction,
    githubCreateIssueCommentAiAction,
    githubListIssueCommentsAction,
    githubLockIssueAiAction,
    githubUnlockIssueAiAction,
    githubAddLabelsToIssueAiAction,
    githubRemoveLabelFromIssueAction,
    githubSetIssueLabelsAction,
    githubListIssueLabelsAction,
    githubAddAssigneesToIssueAction,
    githubRemoveAssigneesFromIssueAction,
    githubListAssigneesAction,
    githubListRepositoryLabelsAction,
    githubCreateLabelAction,
    githubUpdateLabelAction,
    githubCreatePullRequestAction,
    githubGetPullRequestAction,
    githubListPullRequestsAction,
    githubUpdatePullRequestAction,
    githubMergePullRequestAction,
    githubListPullRequestFilesAction,
    githubListPullRequestCommitsAction,
    githubCreatePullRequestReviewAction,
    githubRequestPullRequestReviewersAction,
    githubCreatePullRequestReviewCommentAiAction,
    githubListPullRequestReviewCommentsAction,
    githubListPullRequestReviewsAction,
    githubGetRepositoryAction,
    githubListMyRepositoriesAction,
    githubListUserRepositoriesAction,
    githubListOrganizationRepositoriesAction,
    githubCreateRepositoryAction,
    githubCreateOrganizationRepositoryAction,
    githubUpdateRepositoryAction,
    githubListBranchesAction,
    githubGetBranchAction,
    githubListCommitsAction,
    githubGetCommitAction,
    githubCompareCommitsAction,
    githubListContributorsAction,
    githubListLanguagesAction,
    githubListTagsAction,
    githubGetFileContentAction,
    githubCreateOrUpdateFileAction,
    githubDeleteFileAction,
    githubGetRepositoryTreeAction,
    githubCreateBranchAiAction,
    githubGetReferenceAction,
    githubDeleteBranchAiAction,
    githubSearchRepositoriesAction,
    githubSearchIssuesAndPullRequestsAction,
    githubSearchCodeAction,
    githubSearchUsersAction,
    githubGetAuthenticatedUserAction,
    githubGetUserAction,
    githubListOrganizationMembersAction,
    githubCreateReleaseAction,
    githubListReleasesAction,
    githubGetReleaseAction,
    githubGetLatestReleaseAction,
    githubListCollaboratorsAction,
    githubAddCollaboratorAction,
    githubRemoveCollaboratorAction,
    githubCreateMilestoneAction,
    githubListMilestonesAction,
    githubGetMilestoneAction,
    githubUpdateMilestoneAction,
    githubStarRepositoryAction,
    githubUnstarRepositoryAction,
    githubListStarredRepositoriesAction,
    githubCheckRepositoryStarredAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.github.com',
      auth: githubAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await githubAuthHelpers.getBearerToken(
          auth as GithubAuthValue
        )}`,
      }),
    }),
  ],
  authors: [
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'tintinthedev',
    'murex971',
    'sanket-a11y',
  ],
  triggers: githubTriggers,
});
