import { createAction } from '@activepieces/pieces-framework';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getForm = createAction({
  auth: formStackAuth,
  name: 'getForm',
  displayName: 'Get Forms',
  description: 'Fetch all forms from your Formstack account.',
  props: {},
  async run({ auth }) {
    const forms = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      '/form.json'
    );
    return forms;
  },
});
