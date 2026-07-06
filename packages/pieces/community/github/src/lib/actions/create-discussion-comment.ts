import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateDiscussionCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_discussion_comment',
  displayName: 'Create Discussion Comment',
  description: 'Creates a comment on a discussion in a GitHub repository',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a comment on a GitHub Discussion (via the GraphQL API) identified by its discussion ID. Use to reply to a repository discussion thread. Not idempotent: each call adds a new comment.',
    idempotent: false,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: 'The number of the discussion to comment on',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment (supports markdown)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { discussion_number, body } = propsValue;
    const { owner, repo } = propsValue.repository!;

    // GitHub Discussions API requires GraphQL for most operations
    const query = `
		mutation AddDiscussionComment {
			addDiscussionComment(input: {
				discussionId: "${discussion_number}",
				repositoryName: "${repo}",
				repositoryOwner: "${owner}",
				body: "${body.replace(/"/g, '\\"')}"
			}) {
				comment {
					id
					body
					createdAt
					url
				}
			}
		}`;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: '/graphql',
      body: {
        query,
      },
    });

    return response;
  },
});
