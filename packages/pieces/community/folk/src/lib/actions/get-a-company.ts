import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getCompany = createAction({
  auth: folkAuth,
  name: 'get-a-company',
  displayName: 'Get a Company',
  description: 'Retrieve an existing company in the workspace',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { companyId } = context.propsValue;

    // Validate inputs
    await propsValidation.validateZod(context.propsValue, {
      companyId: z.string().min(1, 'Company ID is required'),
    });

    // Make the API call
    const response = await folkApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: `/companies/${companyId}`,
    });

    return response;
  },
});
