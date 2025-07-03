import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { filloutFormsAuth } from '../common/auth';

export const getSingleResponse = createAction({
  auth: filloutFormsAuth,
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
  },
  async run(context) {
    const apiKey = context.auth;
    const formId = context.propsValue.formId;
    const submissionId = context.propsValue.submissionId;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.fillout.com/v1/api/forms/${formId}/submissions/${submissionId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    
    return response.body;
  },
});