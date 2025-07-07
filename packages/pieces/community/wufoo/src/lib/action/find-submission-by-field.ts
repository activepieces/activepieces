import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooFindSubmissionByField = createAction({
  name: 'find_submission_by_field',
  displayName: 'Find Submission by Field Value',
  description: 'Search for a specific submission based on field values (e.g., email, name).',
  props: {
    formIdentifier: Property.ShortText({
      displayName: 'Form Identifier',
      description: 'The hash or title of the form.',
      required: true,
    }),
    fieldId: Property.ShortText({
      displayName: 'Field ID',
      description: 'The API ID of the field to search by.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value to search for in the specified field.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { formIdentifier, fieldId, value } = propsValue;
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms/${formIdentifier}/entries.json?Field${fieldId}=${encodeURIComponent(value)}`;
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