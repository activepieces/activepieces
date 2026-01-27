import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getCompany = createAction({
  auth: folkAuth,
  name: 'getCompany',
  displayName: 'Get Company',
  description: 'Retrieve detailed information about a company from your Folk workspace.',
  props: {
    companyId: folkProps.company_id(true),
  },
  async run(context) {
    const { companyId } = context.propsValue;

    const response = await folkClient.getCompany({
      apiKey: context.auth,
      companyId: companyId as string,
    });

    return {
      company: response.data,
    };
  },
});

