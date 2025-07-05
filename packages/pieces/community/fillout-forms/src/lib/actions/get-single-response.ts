import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { formIdDropdown, submissionIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../../index';

export const getSingleResponse = createAction({
  auth: filloutFormsAuth,
  name: 'getSingleResponse',
  displayName: 'Get Single Response',
  description: 'Retrieve a specific submission from a form. Select a form first, then choose from available submissions. Returns an object with a "submission" property containing the response data.',
  props: {
    formId: formIdDropdown,
    submissionId: submissionIdDropdown,
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
    
    const queryParams: Record<string, any> = {};
    if (context.propsValue['includeEditLink'] !== undefined) {
      queryParams['includeEditLink'] = context.propsValue['includeEditLink'];
    }
    
    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/submissions/${submissionId}`,
      queryParams
    );
    return response;
  },
});
