import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { userIdDropdown } from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const deleteUserAction = createAction({
  auth: zendeskAuth,
  name: 'delete-user',
  displayName: 'Delete User',
  description: 'Remove a user and associated records from the account.',
  props: {
    user_id: userIdDropdown,
    confirmation: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'I understand that deleted users are not recoverable and this action cannot be undone.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      user_id,
      confirmation,
    } = propsValue;

    if (!confirmation) {
      throw new Error('You must confirm that you understand this action cannot be undone.');
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/users/${user_id}.json`,
        method: HttpMethod.DELETE,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      return {
        success: true,
        message: `User ${user_id} has been deleted`,
        data: response.body,
        warning: "Deleted users are not recoverable in Zendesk UI. For GDPR erasure, use 'Permanently Delete User' if required.",
        note: 'To comply with GDPR, you may need to use the "Permanently Delete User" endpoint for complete data removal.',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check the user ID and try again.'
        );
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to manage users.'
        );
      }
      
      if (errorMessage.includes('404')) {
        throw new Error(
          `User with ID ${user_id} not found. Please verify the user ID.`
        );
      }
      
      if (errorMessage.includes('422')) {
        throw new Error(
          'Cannot delete this user. The user may be the account owner or have restrictions preventing deletion.'
        );
      }
      
      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to delete user: ${errorMessage}`);
    }
  },
});
