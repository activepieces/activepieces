import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

export const createIssue = createAction({
  auth: giteaAuth,
  name: 'create_issue',
  displayName: 'Create Issue',
  description: 'Creates a new issue in a repository.',
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
