import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getEntryDetails = createAction({
  name: 'get_entry_details',
  displayName: 'Get Entry Details',
  description: 'Retrieve details of a specific Wufoo form entry by its ID.',
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
      description: 'The hash of the form.',
    },
    entryId: {
      type: 'short-text',
      displayName: 'Entry ID',
      required: true,
      description: 'The ID of the entry to retrieve.',
    },
  },
  async run(context) {
    const { subdomain, formHash, entryId } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries/${entryId}.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
      },
    });
    return response.body?.Entry || null;
  },
}); 