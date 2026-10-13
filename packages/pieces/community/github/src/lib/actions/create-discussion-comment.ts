import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GithubAuthValue } from '../common/auth-helpers';

export const githubCreateDiscussionCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_discussion_comment',
  classification: 'WRITE',
  displayName: 'Create Discussion Comment',
  description: 'Adds a comment to a repository discussion.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a comment on a GitHub Discussion (via the GraphQL API) identified by its discussion ID. Use to reply to a repository discussion thread. Not idempotent: each call adds a new comment.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'discussion',
      display: 'section',
      label: 'Discussion',
      icon: 'inbox',
      props: ['repository', 'discussion_number'],
    },
    {
      key: 'comment',
      display: 'section',
      label: 'Comment',
      icon: 'reply',
      props: ['body'],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: 'The number shown after # on GitHub.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment',
      description: 'Markdown is supported.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    return postDiscussionComment({
      auth,
      owner,
      repo,
      discussionNumber: propsValue.discussion_number,
      body: propsValue.body,
    });
  },
});

async function postDiscussionComment({
  auth,
  owner,
  repo,
  discussionNumber,
  body,
}: PostDiscussionCommentParams) {
  const lookup = await githubApiCall<DiscussionLookupResponse>({
    auth,
    method: HttpMethod.POST,
    resourceUri: '/graphql',
    body: {
      query: DISCUSSION_LOOKUP_QUERY,
      variables: { owner, name: repo, number: discussionNumber },
    },
  });

  const lookupErrors = lookup.body.errors ?? [];
  const discussionId = lookup.body.data?.repository?.discussion?.id;
  const notFound =
    lookupErrors.every((error) => error.type === 'NOT_FOUND') && !discussionId;
  if (notFound) {
    throw new Error(
      `Discussion #${discussionNumber} was not found in ${owner}/${repo}.`
    );
  }
  if (lookupErrors.length > 0 || !discussionId) {
    throw new Error(lookupErrors[0]?.message ?? 'Discussion lookup failed.');
  }

  const response = await githubApiCall<AddDiscussionCommentResponse>({
    auth,
    method: HttpMethod.POST,
    resourceUri: '/graphql',
    body: {
      query: ADD_DISCUSSION_COMMENT_MUTATION,
      variables: { discussionId, body },
    },
  });

  const mutationErrors = response.body.errors ?? [];
  if (mutationErrors.length > 0) {
    throw new Error(mutationErrors[0].message);
  }

  return response;
}

const DISCUSSION_LOOKUP_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    discussion(number: $number) {
      id
    }
  }
}`;

const ADD_DISCUSSION_COMMENT_MUTATION = `mutation($discussionId: ID!, $body: String!) {
  addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
    comment {
      id
      body
      createdAt
      url
    }
  }
}`;

export const githubDiscussionComments = {
  post: postDiscussionComment,
};

type PostDiscussionCommentParams = {
  auth: GithubAuthValue;
  owner: string;
  repo: string;
  discussionNumber: number;
  body: string;
};

type GraphqlError = {
  message: string;
  type?: string;
};

type DiscussionLookupResponse = {
  data?: {
    repository: {
      discussion: {
        id: string;
      } | null;
    } | null;
  } | null;
  errors?: GraphqlError[];
};

type AddDiscussionCommentResponse = {
  data?: {
    addDiscussionComment: {
      comment: {
        id: string;
        body: string;
        createdAt: string;
        url: string;
      };
    } | null;
  } | null;
  errors?: GraphqlError[];
};
