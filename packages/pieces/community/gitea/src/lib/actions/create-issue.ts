import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaCommon } from '../common/props';
import { giteaApiCall } from '../common/client';

export const createIssue = createAction({
  auth: giteaAuth,
  name: 'create_issue',
  displayName: 'Create Issue',
  description: 'Creates a new issue in a repository.',
  audience: 'both',
  aiMetadata: { description: 'Opens a new issue on a Gitea repository with a title and optional body. Use to file a bug, task, or feature request. Requires the target repository; each call creates a separate issue, so it is not idempotent.', idempotent: false },
  props: {
    repository: giteaCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: false,
    }),
  },
  async run(context) {
    const { repo, owner } = context.propsValue.repository!;
    const { title, body } = context.propsValue;

    const response = await giteaApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues`,
      body: {
        title,
        body,
      },
    });

    return response.body;
  },
});
