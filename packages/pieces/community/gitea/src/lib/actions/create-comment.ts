import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

export const createComment = createAction({
  auth: giteaAuth,
  name: 'create_comment',
  displayName: 'Add Comment to Issue/PR',
  description: 'Adds a comment to an issue or pull request.',
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
