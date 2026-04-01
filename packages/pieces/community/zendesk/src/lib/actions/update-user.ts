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
import { userFieldsDynamicProp } from '../common/props';

export const updateUserAction = createAction({
  auth: zendeskAuth,
  name: 'update-user',
  displayName: 'Update User',
  description: 'Update existing user fields.',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user to update.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the user.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email address for the user.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New phone number for the user.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for the user. This replaces all existing tags.',
      required: false,
    }),
    user_fields: userFieldsDynamicProp,
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const {
      user_id,
      name,
      email,
      phone,
      tags,
      user_fields,
    } = propsValue;

    const user: Record<string, unknown> = {};

    if (name !== undefined && name !== null && name !== '') {
      user.name = name.trim();
    }

    const optionalParams = {
      email,
      phone,
      tags,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined && value !== '') {
        user[key] = value;
      }
    }

    if (user_fields && typeof user_fields === 'object') {
      const userFieldsObj: Record<string, any> = {};

      for (const [propKey, value] of Object.entries(user_fields)) {
        if (value !== null && value !== undefined && value !== '') {
          const fieldKey = propKey.startsWith('field_') ? propKey.substring(6) : propKey;
          userFieldsObj[fieldKey] = value;
        }
      }

      if (Object.keys(userFieldsObj).length > 0) {
        user.user_fields = userFieldsObj;
      }
    }

    if (Object.keys(user).length === 0) {
      throw new Error('No fields provided to update. Please specify at least one field to modify.');
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/users/${user_id}.json`,
        method: HttpMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
        body: {
          user,
        },
      });

      return {
        success: true,
        message: 'User updated successfully',
        data: response.body,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your input values and try again.'
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
          'Validation error. The user email may already exist or be invalid. User emails must be unique and cannot be empty.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to update user: ${errorMessage}`);
    }
  },
});
