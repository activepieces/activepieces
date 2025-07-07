import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooGetEntryDetails = createAction({
  name: 'get_entry_details',
  displayName: 'Get Entry Details',
  description: 'Retrieve details of a specific entry (submission) by its ID.',
  props: {
    formIdentifier: Property.ShortText({
      displayName: 'Form Identifier',
      description: 'The hash or title of the form.',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry (submission).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { formIdentifier, entryId } = propsValue;
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms/${formIdentifier}/entries/${entryId}.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${auth.apiKey}:footastic`).toString('base64'),
      },
    });
    return response.body;
  },
}); 