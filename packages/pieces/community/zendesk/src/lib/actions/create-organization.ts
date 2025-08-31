import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { groupIdDropdown } from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const createOrganizationAction = createAction({
  auth: zendeskAuth,
  name: 'create-organization',
  displayName: 'Create Organization',
  description: 'Create a new organization record.',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Unique name for the organization',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'External ID for integration purposes',
      required: false,
    }),
    group_id: groupIdDropdown,
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Domain names associated with the organization',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the organization',
      required: false,
    }),
    organization_fields: Property.DynamicProperties({
      displayName: 'Organization Fields',
      description: 'Custom organization field values',
      required: false,
      refreshers: ['auth'],
      props: async ({ auth }) => {
        if (!auth) {
          return {};
        }

        try {
          const authentication = auth as AuthProps;
          const response = await httpClient.sendRequest({
            url: `https://${authentication.subdomain}.zendesk.com/api/v2/organization_fields.json`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authentication.email + '/token',
              password: authentication.token,
            },
          });

          const fields = (response.body as { organization_fields: Array<{
            id: number;
            key: string;
            title: string;
            description?: string;
            type: string;
            active: boolean;
            custom_field_options?: Array<{ name: string; value: string }>;
            regexp_for_validation?: string;
          }> }).organization_fields;

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
          console.warn('Failed to load organization fields:', error);
          return {};
        }
      },
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description: 'Allow users to see each other\'s tickets',
      required: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description: 'Allow users to see each other\'s comments',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      name,
      details,
      notes,
      external_id,
      group_id,
      domain_names,
      tags,
      organization_fields,
      shared_tickets,
      shared_comments,
    } = propsValue;

    const organization: Record<string, unknown> = {
      name: name.trim(),
    };

    const optionalParams = {
      details,
      notes,
      external_id,
      group_id,
      domain_names,
      tags,
      shared_tickets,
      shared_comments,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined && value !== '') {
        organization[key] = value;
      }
    }

    if (organization_fields && typeof organization_fields === 'object') {
      try {
        const fieldsResponse = await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/organization_fields.json`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });

        const fieldDefinitions = (fieldsResponse.body as { organization_fields: Array<{
          id: number;
          key: string;
          type: string;
        }> }).organization_fields;

        const orgFieldsObj: Record<string, any> = {};

        for (const [propKey, value] of Object.entries(organization_fields)) {
          if (value !== null && value !== undefined && value !== '') {
            const fieldKey = propKey.startsWith('field_') ? propKey.substring(6) : propKey;
            
            const fieldDef = fieldDefinitions.find(f => f.key === fieldKey);
            if (fieldDef) {
              let formattedValue = value;
              if (fieldDef.type === 'date' && value) {
                formattedValue = new Date(value as string).toISOString().split('T')[0];
              }
              
              orgFieldsObj[fieldDef.key] = formattedValue;
            }
          }
        }

        if (Object.keys(orgFieldsObj).length > 0) {
          organization.organization_fields = orgFieldsObj;
        }
      } catch (error) {
        console.warn('Failed to process organization fields:', error);
      }
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/organizations.json`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: {
          organization,
        },
      });

      return {
        success: true,
        message: 'Organization created successfully',
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
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to manage organizations.'
        );
      }

      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. The organization name may already exist or be invalid. Organization names must be unique and cannot be empty.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create organization: ${errorMessage}`);
    }
  },
});
