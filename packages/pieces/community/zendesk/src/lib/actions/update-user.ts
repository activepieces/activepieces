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
    user_fields: Property.DynamicProperties({
      auth: zendeskAuth,
      displayName: 'User Fields',
      description: 'Custom user field values.',
      required: false,
      refreshers: ['auth'],
      props: async ({ auth }) => {
        if (!auth) {
          return {};
        }

        try {
          const authentication = auth;
          const response = await httpClient.sendRequest({
            url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/user_fields.json`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authentication.props.email + '/token',
              password: authentication.props.token,
            },
          });

          const fields = (response.body as { user_fields: Array<{
            id: number;
            key: string;
            title: string;
            description?: string;
            type: string;
            active: boolean;
            custom_field_options?: Array<{ name: string; value: string }>;
          }> }).user_fields;

          const dynamicProps: Record<string, any> = {};

          for (const field of fields) {
            if (!field.active) continue;

            const fieldKey = `field_${field.key}`;
            const displayName = field.title;
            const description = field.description || `Custom ${field.type} field`;

            switch (field.type) {
              case 'dropdown':
                if (field.custom_field_options && field.custom_field_options.length > 0) {
                  dynamicProps[fieldKey] = Property.StaticDropdown({
                    displayName,
                    description,
                    required: false,
                    options: {
                      disabled: false,
                      placeholder: `Select ${displayName}`,
                      options: field.custom_field_options.map(option => ({
                        label: option.name,
                        value: option.value,
                      })),
                    },
                  });
                }
                break;
              case 'text':
                dynamicProps[fieldKey] = Property.ShortText({
                  displayName,
                  description,
                  required: false,
                });
                break;
              case 'textarea':
                dynamicProps[fieldKey] = Property.LongText({
                  displayName,
                  description,
                  required: false,
                });
                break;
              default:
                dynamicProps[fieldKey] = Property.ShortText({
                  displayName,
                  description: `${description} (${field.type})`,
                  required: false,
                });
            }
          }

          return dynamicProps;
        } catch (error) {
          console.warn('Failed to load user fields:', error);
          return {};
        }
      },
    }),
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
