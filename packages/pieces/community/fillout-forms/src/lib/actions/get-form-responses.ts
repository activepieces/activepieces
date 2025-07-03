import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { filloutFormsAuth } from '../common/auth';

export const getFormResponses = createAction({
  auth: filloutFormsAuth,
  name: 'getFormResponses',
  displayName: 'Get Form Responses',
  description: 'Fetch all responses for a Fillout form, with optional filters.',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      required: true,
      description: 'The public identifier of your Fillout form.'
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Max number of submissions to retrieve (1-150).'
    }),
    afterDate: Property.DateTime({
      displayName: 'After Date',
      required: false,
      description: 'Filter submissions after this date.'
    }),
    beforeDate: Property.DateTime({
      displayName: 'Before Date',
      required: false,
      description: 'Filter submissions before this date.'
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Finished', value: 'finished' },
          { label: 'In Progress', value: 'in_progress' }
        ]
      },
      description: 'Submission status to filter by.'
    }),
  },
  async run(context) {
    const apiKey = context.auth;
    const queryParams: Record<string, any> = {};
    
    if (context.propsValue.formId) queryParams.formId = context.propsValue.formId;
    if (context.propsValue.limit) queryParams.limit = context.propsValue.limit;
    if (context.propsValue.afterDate) queryParams.afterDate = context.propsValue.afterDate;
    if (context.propsValue.beforeDate) queryParams.beforeDate = context.propsValue.beforeDate;
    if (context.propsValue.status) queryParams.status = context.propsValue.status;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.fillout.com/v1/api/forms/${context.propsValue.formId}/submissions`,
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      queryParams
    });
    
    return response.body;
  },
});