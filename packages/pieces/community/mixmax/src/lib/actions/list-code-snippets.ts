import { createAction } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const listCodeSnippets = createAction({
  auth: mixmaxAuth,
  name: 'list_code_snippets',
  displayName: 'List Code Snippets',
  description:
    'List all code snippets in Mixmax. [See the documentation](https://developer.mixmax.com/reference/codesnippets)',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves all code snippets in the Mixmax account. Takes no input. Use to enumerate available snippets or to find a snippet id before reusing it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await mixmaxApiClient.getRequest({
      auth,
      endpoint: '/codesnippets',
    });
    return response.body;
  },
});
