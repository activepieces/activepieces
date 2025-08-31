import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import {
  organizationIdDropdown,
  customRoleIdDropdown,
  agentBrandIdDropdown,
  groupIdDropdown,
} from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const createUserAction = createAction({
  auth: zendeskAuth,
  name: 'create-user',
  displayName: 'Create User',
  description: 'Add a new user to the Zendesk instance.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the user',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The primary email address of the user',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description:
        'The role of the user. Defaults to "end-user" if not specified.',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select role (optional)',
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    custom_role_id: customRoleIdDropdown,
    organization_id: organizationIdDropdown,
    organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description:
        'Create and associate user with a new organization by name (alternative to Organization ID)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the user',
      required: false,
    }),
    alias: Property.ShortText({
      displayName: 'Alias',
      description: 'An alias displayed to end users',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the user',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the user',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description:
        'A unique external ID for the user (useful for integrations)',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'The time zone of the user (e.g., "America/New_York")',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'The locale of the user (e.g., "en-US")',
      required: false,
    }),
    verified: Property.Checkbox({
      displayName: 'Verified',
      description: 'Whether the user is verified',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the user is active. Defaults to true.',
      required: false,
    }),
    shared: Property.Checkbox({
      displayName: 'Shared',
      description:
        'Whether the user is shared from a different Zendesk Support instance',
      required: false,
    }),
    shared_agent: Property.Checkbox({
      displayName: 'Shared Agent',
      description:
        'Whether the user is a shared agent from a different Zendesk Support instance',
      required: false,
    }),
    moderator: Property.Checkbox({
      displayName: 'Moderator',
      description: 'Whether the user has forum moderation capabilities',
      required: false,
    }),
    suspended: Property.Checkbox({
      displayName: 'Suspended',
      description: 'Whether the user is suspended',
      required: false,
    }),
    restricted_agent: Property.Checkbox({
      displayName: 'Restricted Agent',
      description:
        'Whether the agent has restrictions on what tickets they can access',
      required: false,
    }),
    only_private_comments: Property.Checkbox({
      displayName: 'Only Private Comments',
      description: 'Whether the user can only create private comments',
      required: false,
    }),
    report_csv: Property.Checkbox({
      displayName: 'Report CSV',
      description: 'Whether the user can access CSV reports',
      required: false,
    }),
    skip_verify_email: Property.Checkbox({
      displayName: 'Skip Verify Email',
      description: 'Skip sending a verification email to the user',
      required: false,
    }),
    ticket_restriction: Property.StaticDropdown({
      displayName: 'Ticket Restriction',
      description: 'The ticket restriction for the user',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select restriction (optional)',
        options: [
          { label: 'Organization', value: 'organization' },
          { label: 'Groups', value: 'groups' },
          { label: 'Assigned', value: 'assigned' },
          { label: 'Requested', value: 'requested' },
        ],
      },
    }),
    signature: Property.LongText({
      displayName: 'Signature',
      description: "The user's signature for email responses",
      required: false,
    }),
    default_group_id: groupIdDropdown,
    agent_brand_ids: agentBrandIdDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to apply to the user',
      required: false,
    }),
    user_fields: Property.DynamicProperties({
      displayName: 'User Fields',
      description: 'Custom user field values',
      required: false,
      refreshers: ['auth'],
      props: async ({ auth }) => {
        if (!auth) {
          return {};
        }

        try {
          const authentication = auth as AuthProps;
          const response = await httpClient.sendRequest({
            url: `https://${authentication.subdomain}.zendesk.com/api/v2/user_fields.json`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authentication.email + '/token',
              password: authentication.token,
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
            regexp_for_validation?: string;
          }> }).user_fields;

          const dynamicProps: Record<string, any> = {};
          for (const field of fields) {
            if (!field.active) continue;

            const fieldKey = `field_${field.key}`;
            const displayName = field.title;
            const description = field.description || `Custom ${field.type} field`;

            switch (field.type) {
              case 'tagger':
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
              case 'multiselect':
                if (field.custom_field_options && field.custom_field_options.length > 0) {
                  dynamicProps[fieldKey] = Property.StaticMultiSelectDropdown({
                    displayName,
                    description,
                    required: false,
                    options: {
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
              case 'integer':
              case 'decimal':
                dynamicProps[fieldKey] = Property.Number({
                  displayName,
                  description,
                  required: false,
                });
                break;
              case 'date':
                dynamicProps[fieldKey] = Property.DateTime({
                  displayName,
                  description,
                  required: false,
                });
                break;
              case 'checkbox':
                dynamicProps[fieldKey] = Property.Checkbox({
                  displayName,
                  description,
                  required: false,
                });
                break;
              case 'regexp':
                dynamicProps[fieldKey] = Property.ShortText({
                  displayName,
                  description: `${description}${field.regexp_for_validation ? ` (Pattern: ${field.regexp_for_validation})` : ''}`,
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
    identities: Property.Json({
      displayName: 'Identities',
      description:
        'Array of identity objects with type and value. Example: [{"type": "email", "value": "test@user.com"}, {"type": "twitter", "value": "username"}]',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      name,
      email,
      role,
      custom_role_id,
      organization_id,
      organization_name,
      phone,
      alias,
      details,
      notes,
      external_id,
      time_zone,
      locale,
      verified,
      active,
      shared,
      shared_agent,
      moderator,
      suspended,
      restricted_agent,
      only_private_comments,
      report_csv,
      skip_verify_email,
      ticket_restriction,
      signature,
      default_group_id,
      agent_brand_ids,
      tags,
      user_fields,
      identities,
    } = propsValue;

    const user: Record<string, unknown> = {
      name,
    };

    if (email) {
      user.email = email;
    }

    if (role) {
      user.role = role;
      if (role === 'agent' && custom_role_id) {
        user.custom_role_id = custom_role_id;
      }
    } else if (custom_role_id) {
      user.role = 'agent';
      user.custom_role_id = custom_role_id;
    }

    if (organization_id) {
      user.organization_id = organization_id;
    } else if (organization_name) {
      user.organization = {
        name: organization_name,
      };
    }

    const booleanParams = {
      verified,
      active,
      shared,
      shared_agent,
      moderator,
      suspended,
      restricted_agent,
      only_private_comments,
      report_csv,
    };

    for (const [key, value] of Object.entries(booleanParams)) {
      if (value !== undefined && value !== null) {
        user[key] = value;
      }
    }

    const optionalParams = {
      phone,
      alias,
      details,
      notes,
      external_id,
      time_zone,
      locale,
      ticket_restriction,
      signature,
      default_group_id,
      tags,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined && value !== '') {
        user[key] = value;
      }
    }

    if (
      agent_brand_ids &&
      Array.isArray(agent_brand_ids) &&
      agent_brand_ids.length > 0
    ) {
      const brandIds = agent_brand_ids.map((id) =>
        typeof id === 'string' ? parseInt(id) : id
      );
      user.agent_brand_ids = brandIds;
    }

    if (user_fields && typeof user_fields === 'object') {
      try {
        const fieldsResponse = await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/user_fields.json`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });

        const defs = (fieldsResponse.body as { user_fields: Array<{ id: number; key: string; type: string }> }).user_fields;
        const mapped: Record<string, unknown> = {};
        for (const [propKey, value] of Object.entries(user_fields)) {
          if (value === undefined || value === null || value === '') continue;
          const key = propKey.startsWith('field_') ? propKey.substring(6) : propKey;
          const def = defs.find(d => d.key === key);
          if (!def) continue;
          let formatted: unknown = value;
          if (def.type === 'date' && typeof value === 'string') {
            formatted = new Date(value).toISOString();
          }
          mapped[def.key] = formatted;
        }
        if (Object.keys(mapped).length > 0) {
          user.user_fields = mapped;
        }
      } catch (error) {
        console.warn('Failed to process user fields:', error);
      }
    }

    if (identities) {
      try {
        const identitiesArray =
          typeof identities === 'string' ? JSON.parse(identities) : identities;
        if (!Array.isArray(identitiesArray)) {
          throw new Error(
            'Identities must be an array of objects with type and value properties.'
          );
        }

        for (const identity of identitiesArray) {
          if (!identity.type || !identity.value) {
            throw new Error(
              'Each identity must have both "type" and "value" properties.'
            );
          }
        }

        user.identities = identitiesArray;
      } catch (error) {
        throw new Error(
          `Invalid identities format: ${(error as Error).message}`
        );
      }
    }

    const requestBody: Record<string, unknown> = {
      user,
    };

    if (skip_verify_email) {
      requestBody.skip_verify_email = true;
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/users.json`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: requestBody,
      });

      return {
        success: true,
        message: 'User created successfully',
        data: response.body,
        user_role: user.role || 'end-user',
        verification_email_sent: !skip_verify_email,
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

      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. The email may already exist, be invalid, or required fields may be missing.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create user: ${errorMessage}`);
    }
  },
});
