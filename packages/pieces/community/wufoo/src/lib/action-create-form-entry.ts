import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createFormEntry = createAction({
  name: 'create_form_entry',
  displayName: 'Create Form Entry',
  description: 'Submit a new entry to a Wufoo form.',
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
    formHash: {
      type: 'short-text',
      displayName: 'Form Hash',
      required: true,
      description: 'The hash of the form to submit to.',
    },
    entryData: {
      type: 'object',
      displayName: 'Entry Data',
      required: true,
      description: 'Key-value pairs for the form fields (use API IDs as keys).',
    },
  },
  async run(context) {
    const { subdomain, formHash, entryData } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: entryData,
    });
    return response.body;
  },
}); 