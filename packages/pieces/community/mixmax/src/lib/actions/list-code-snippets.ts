import { createAction, Property } from '@activepieces/pieces-framework';
import { mixmaxAuth } from '../..';
import { mixmaxGetRequest } from '../common';

export const listCodeSnippets = createAction({
  auth: mixmaxAuth,
  name: 'list_code_snippets',
  displayName: 'List Code Snippets',
  description: 'List all code snippets in Mixmax. [See the documentation](https://developer.mixmax.com/reference/codesnippets)',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of snippets to return (default: 20)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.limit) queryParams['limit'] = String(propsValue.limit);

    const response = await mixmaxGetRequest(auth, '/codesnippets', queryParams);
    return response.body;
  },
});
