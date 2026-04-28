import { createAction } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const listCodeSnippets = createAction({
  auth: mixmaxAuth,
  name: 'list_code_snippets',
  displayName: 'List Code Snippets',
  description:
    'List all code snippets in Mixmax. [See the documentation](https://developer.mixmax.com/reference/codesnippets)',
  props: {},
  async run({ auth }) {
    const response = await mixmaxApiClient.getRequest({
      auth,
      endpoint: '/codesnippets',
    });
    return response.body;
  },
});
