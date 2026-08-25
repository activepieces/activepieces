import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall } from '../common/client';
import { giteaCommon } from '../common/props';

export const createComment = createAction({
  auth: giteaAuth,
  name: 'create_comment',
  displayName: 'Add Comment to Issue/PR',
  description: 'Adds a comment to an issue or pull request.',
  audience: 'both',
  aiMetadata: { description: 'Posts a comment on a Gitea issue or pull request, identified by its index number within the repository (issues and PRs share the same number space). Use to reply, give feedback, or note status. Each call appends a new comment, so it is not idempotent.', idempotent: false },
  props: {
    repository: giteaCommon.repositoryDropdown,
    index: Property.Number({
      displayName: 'Issue/PR Index',
      description: 'The index of the issue or pull request.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      required: true,
    }),
  },
  async run(context) {
    const { repo, owner } = context.propsValue.repository!;
    const { index, body } = context.propsValue;

    const response = await giteaApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${index}/comments`,
      body: {
        body,
      },
    });

    return response.body;
  },
});
