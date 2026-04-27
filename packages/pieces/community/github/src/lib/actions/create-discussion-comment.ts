import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateDiscussionCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_discussion_comment',
  displayName: 'Create Discussion Comment',
  description: 'Creates a comment on a discussion in a GitHub repository',
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

    // Step 1: Resolve the discussion number to its GraphQL node ID.
    // The addDiscussionComment mutation requires a global node ID, not a discussion number.
    const lookupQuery = `
      query GetDiscussionId($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          discussion(number: $number) {
            id
          }
        }
      }`;

    const lookupResponse = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: '/graphql',
      body: {
        query: lookupQuery,
        variables: { owner, repo, number: discussion_number },
      },
    });

    const discussionId = lookupResponse?.data?.repository?.discussion?.id;
    if (!discussionId) {
      throw new Error(
        `Discussion #${discussion_number} not found in ${owner}/${repo}`
      );
    }

    // Step 2: Add the comment using the node ID.
    const mutationQuery = `
      mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
        addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
          comment {
            id
            body
            createdAt
            url
          }
        }
      }`;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: '/graphql',
      body: {
        query: mutationQuery,
        variables: { discussionId, body },
      },
    });

    return response;
  },
});
