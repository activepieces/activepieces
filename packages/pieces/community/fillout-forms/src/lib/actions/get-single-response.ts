import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSingleResponse = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getSingleResponse',
  displayName: 'Get Single Response',
  description: 'Retrieve a specific submission by its response ID.',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      required: true,
      description: 'The public identifier of your Fillout form.'
    }),
    submissionId: Property.ShortText({
      displayName: 'Submission ID',
      required: true,
      description: 'The identifier of the submission/response.'
    }),
    includeEditLink: Property.Checkbox({
      displayName: 'Include Edit Link',
      required: false,
      description: 'Include a link to edit the submission.'
    })
  },
  async run(context) {
    const formId = context.propsValue['formId'];
    const submissionId = context.propsValue['submissionId'];

    const queryParams: Record<string, any> = {};
    
    const apiKey = (context.auth as Record<string, string>)['apiKey'];
    if (!apiKey) {
      throw new Error('API Key is required for authentication.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.fillout.com/v1/api/forms/${formId}/submissions/${submissionId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      queryParams
    });
    return response.body;
  },
});
