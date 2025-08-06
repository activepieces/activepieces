import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const updateOrganization = createAction({
  auth: zendeskAuth,
  name: 'update_organization',
  displayName: 'Update Organization',
  description: 'Update existing organization fields or create a new organization if it doesn\'t exist. Only admins and agents with organization permissions can update organizations.',
  props: {
    operation_type: Property.StaticDropdown({
      displayName: 'Operation Type',
      description: 'Choose whether to update an existing organization or create/update (creates if not exists)',
      required: true,
      options: {
        options: [
          { label: 'Update Existing Organization', value: 'update' },
          { label: 'Create or Update Organization', value: 'create_or_update' },
        ],
      },
    }),
    organization_id: Property.Dropdown({
      displayName: 'Organization',
      description: 'Select an organization to update (only for update operation)',
      required: false,
      refreshers: ['auth', 'operation_type'],
      options: async ({ auth, operation_type }) => {
        if (!auth || operation_type !== 'update') {
          return {
            disabled: true,
            placeholder: operation_type === 'create_or_update' ? 'Not needed for create/update operation' : 'Please connect your account first.',
            options: [],
          };
        }

        try {
          const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };
          
          // Fetch organizations from Zendesk API
          const response = await httpClient.sendRequest<{ organizations: Array<{ id: number; name: string; external_id?: string }> }>({
            url: `https://${subdomain}.zendesk.com/api/v2/organizations.json?per_page=100`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: email + '/token',
              password: token,
            },
            timeout: 30000, // 30 seconds timeout
          });

          if (response.body.organizations && response.body.organizations.length > 0) {
            return {
              disabled: false,
              options: response.body.organizations.map((org) => ({
                label: `${org.name} (ID: ${org.id}${org.external_id ? `, External ID: ${org.external_id}` : ''})`,
                value: org.id.toString(),
              })),
            };
          }

          return {
            disabled: true,
            placeholder: 'No organizations found',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching organizations:', error);
          return {
            disabled: true,
            placeholder: 'Error loading organizations',
            options: [],
          };
        }
      },
    }),
    external_id: Property.Number({
      displayName: 'External ID',
      description: 'External ID for the organization (required for create_or_update if not using organization_id)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the organization',
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Domain names for the organization. WARNING: This will overwrite all existing domain names. Include all domain names you want to keep.',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the organization (agents with restrictions can only update this field)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for the organization',
      required: false,
    }),
    organization_fields: Property.Json({
      displayName: 'Organization Fields',
      description: 'Custom organization fields (JSON format)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    // Validate required fields based on operation type
    if (propsValue.operation_type === 'update' && !propsValue.organization_id) {
      throw new Error('Organization ID is required for update operation');
    }

    if (propsValue.operation_type === 'create_or_update' && !propsValue.organization_id && !propsValue.external_id) {
      throw new Error('Either Organization ID or External ID is required for create_or_update operation');
    }

    const organizationData: { organization: Record<string, unknown> } = {
      organization: {},
    };

    // Add identification fields for create_or_update
    if (propsValue.operation_type === 'create_or_update') {
      if (propsValue.organization_id) {
        organizationData.organization.id = parseInt(propsValue.organization_id);
      }
      if (propsValue.external_id) {
        organizationData.organization.external_id = propsValue.external_id;
      }
    }

    // Add optional fields if provided
    if (propsValue.name) {
      organizationData.organization.name = propsValue.name;
    }

    if (propsValue.domain_names && propsValue.domain_names.length > 0) {
      organizationData.organization.domain_names = propsValue.domain_names;
    }

    if (propsValue.details) {
      organizationData.organization.details = propsValue.details;
    }

    if (propsValue.notes) {
      organizationData.organization.notes = propsValue.notes;
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      organizationData.organization.tags = propsValue.tags;
    }

    if (propsValue.organization_fields) {
      organizationData.organization.organization_fields = propsValue.organization_fields;
    }

    let url: string;
    let method: HttpMethod;

    if (propsValue.operation_type === 'update') {
      // Update existing organization
      url = `https://${subdomain}.zendesk.com/api/v2/organizations/${propsValue.organization_id}.json`;
      method = HttpMethod.PUT;
    } else {
      // Create or update organization
      url = `https://${subdomain}.zendesk.com/api/v2/organizations/create_or_update.json`;
      method = HttpMethod.POST;
    }

    const response = await httpClient.sendRequest<{ organization: Record<string, unknown> }>({
      url,
      method,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: organizationData,
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 