import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  simplybookAuth,
  getAccessToken,
  SimplybookAuth,
  clientDropdown
} from '../common';

export const deleteClient = createAction({
  auth: simplybookAuth,
  name: 'delete_client',
  displayName: 'Delete Client',
  description: 'Delete an existing client',
  props: {
    clientId: clientDropdown
  },
  async run(context) {
    const auth = context.auth.props;
    const accessToken = await getAccessToken(auth);

    const { clientId } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://user-api-v2.simplybook.me/admin/clients/${clientId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return {
        success: true,
        message: `Client ${clientId} deleted successfully`,
        response: response.body
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to delete client: ${error.response.status} - ${JSON.stringify(
            error.response.body
          )}`
        );
      }
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  }
});
