import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsGetEntries = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entries',
  displayName: 'Get Entries',
  description: 'Get all entries for a specific form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form to get entries from',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of entries to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of entries to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, limit, skip } = propsValue;

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('$top', limit.toString());
    if (skip) queryParams.append('$skip', skip.toString());

    const url = `https://www.cognitoforms.com/api/forms/${formId}/entries${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
