import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps } from '../common/types';

export const deleteUser = createAction({
  auth: zendeskAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Delete a user and associated records from Zendesk',
  props: {
    user_id: Property.Number({
      displayName: 'User ID',
      description: 'The ID of the user to delete',
      required: true,
    }),
  },
  sampleData: {
    user_id: 123456789,
    success: true,
    message: 'User deleted successfully',
  },
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;

    try {
      // Zendesk DELETE request for users returns 200/204 with no content on success
      await makeZendeskRequest(
        authentication,
        `/users/${propsValue.user_id}.json`,
        HttpMethod.DELETE
      );

      return {
        user_id: propsValue.user_id,
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 422) {
        // Zendesk doesn't allow deleting users with tickets or other dependencies
        throw new Error('Cannot delete user: User may have associated tickets or other dependencies');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },
});