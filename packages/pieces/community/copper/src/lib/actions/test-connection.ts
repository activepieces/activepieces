import { createAction } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const testConnection = createAction({
  auth: copperAuth,
  name: 'copper_test_connection',
  displayName: 'Test Connection',
  description: 'Test the connection to Copper API',
  props: {},
  async run(context) {
    try {
      const response = await copperRequest({
        auth: context.auth,
        method: HttpMethod.GET,
        url: '/account',
      });
      
      return {
        success: true,
        message: 'Successfully connected to Copper API',
        account: response,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to Copper API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
