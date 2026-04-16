import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { githubAddLabelsToIssueAction } from './lib/actions/add-labels-to-issue'
import { githubCreateBranchAction } from './lib/actions/create-branch'
import { githubCreateCommentOnAIssue } from './lib/actions/create-comment-on-a-issue'
import { githubCreateCommitCommentAction } from './lib/actions/create-commit-comment'
import { githubCreateDiscussionCommentAction } from './lib/actions/create-discussion-comment'
import { githubCreateGistAction } from './lib/actions/create-gist'
import { githubCreateIssueAction } from './lib/actions/create-issue'
import { githubCreatePullRequestReviewCommentAction } from './lib/actions/create-pull-request-review-comment'
import { githubDeleteBranchAction } from './lib/actions/delete-branch'
import { githubFindBranchAction } from './lib/actions/find-branch'
import { githubFindIssueAction } from './lib/actions/find-issue'
import { githubFindUserAction } from './lib/actions/find-user'
import { githubGetIssueInformation } from './lib/actions/get-issue-information'
import { githubLockIssueAction } from './lib/actions/lock-issue'
import { githubRawGraphqlQuery } from './lib/actions/raw-graphql-query'
import { githubUnlockIssueAction } from './lib/actions/unlock-issue'
import { githubUpdateIssueAction } from './lib/actions/update-issue'
import { githubAuth } from './lib/auth'
import { githubTriggers } from './lib/trigger'

export const github = createPiece({
    displayName: 'GitHub',
    description: 'Developer platform that allows developers to create, store, manage and share their code',

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
        createCustomApiCallAction({
            baseUrl: () => 'https://api.github.com',
            auth: githubAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
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
})
