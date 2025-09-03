import { createAction, Property } from '@activepieces/pieces-framework';
import { WebScrapingAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAccountInformation = createAction({
  auth: WebScrapingAuth,
  name: "get_account_info",
  displayName: "Get Account Information",
  description: "Fetch account usage and remaining credits.",
  props: {},

  async run({ auth }) {
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        "/account"
      );

      return {
        success: true,
        account: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message ?? error}`,
        details: error.response ?? error,
      };
    }
  },
});