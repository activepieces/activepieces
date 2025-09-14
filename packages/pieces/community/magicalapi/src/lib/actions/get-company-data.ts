import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import z from 'zod';
import { magicalapiAuth, magicalapiCommon } from '../common';

export const getCompanyData = createAction({
  auth: magicalapiAuth,
  name: 'getCompanyData',
  displayName: 'Get Company Data',
  description:
    'Given a company name or domain, fetch company info (size, industry, etc.).',
  props: magicalapiCommon.getCompanyDataProperties,
  async run({ auth: apiKey, propsValue: { action, requestData } }) {
    if (action === 'create') {
      // Validate the conditional schema
      try {
        await magicalapiCommon.getCompanyDataSchema.parseAsync(requestData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.reduce((acc, err) => {
            const path = err.path.join('.');
            return {
              ...acc,
              [path]: err.message,
            };
          }, {});
          throw new Error(JSON.stringify({ errors }, null, 2));
        }
        throw error;
      }
    } else if (action === 'check') {
      await propsValidation.validateZod(
        requestData,
        magicalapiCommon.checkResultSchema
      );
    }
    return await magicalapiCommon.getCompanyData({
      apiKey,
      ...requestData,
    });
  },
});
