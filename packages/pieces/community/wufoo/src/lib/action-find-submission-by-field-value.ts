import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findSubmissionByFieldValue = createAction({
  name: 'find_submission_by_field_value',
  displayName: 'Find Submission by Field Value',
  description: 'Search for a Wufoo form submission by a specific field value.',
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
    fieldId: {
      type: 'short-text',
      displayName: 'Field API ID',
      required: true,
      description: 'The API ID of the field to search by.',
    },
    fieldValue: {
      type: 'short-text',
      displayName: 'Field Value',
      required: true,
      description: 'The value to search for in the specified field.',
    },
  },
  async run(context) {
    const { subdomain, formHash, fieldId, fieldValue } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json?Filter1=${fieldId}+Is_equal_to+${encodeURIComponent(fieldValue)}`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
      },
    });
    return response.body?.Entries || [];
  },
}); 