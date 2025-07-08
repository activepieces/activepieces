import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findForm = createAction({
  name: 'find_form',
  displayName: 'Find Form by Name or ID',
  description: 'Find a Wufoo form by its name or hash.',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Your Wufoo API Key',
  }),
  props: {
    subdomain: {
      type: 'short-text',
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., fishbowl for https://fishbowl.wufoo.com)',
    },
    search: {
      type: 'short-text',
      displayName: 'Form Name or Hash',
      required: true,
      description: 'The name or hash of the form to find.',
    },
  },
  async run(context) {
    const { subdomain, search } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
      },
    });
    const forms = response.body?.Forms || [];
    const found = forms.find((form: any) => form.Hash === search || form.Name === search);
    return found || null;
  },
}); 