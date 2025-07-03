import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

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
    const apiKey = context.auth as string;

    const formId = context.propsValue['formId'];
    const submissionId = context.propsValue['submissionId'];
    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/submissions/${submissionId}`
    );
    return response;
  },
});
