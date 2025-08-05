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
  description: 'Update existing organization fields',
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name of the organization',
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'New domain names for the organization',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'New details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'New notes about the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'New external ID for the organization',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'New tags for the organization',
      required: false,
    }),
    organization_fields: Property.Json({
      displayName: 'Organization Fields',
      description: 'New custom organization fields (JSON format)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const organizationData: { organization: Record<string, unknown> } = {
      organization: {},
    };

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

    if (propsValue.external_id) {
      organizationData.organization.external_id = propsValue.external_id;
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      organizationData.organization.tags = propsValue.tags;
    }

    if (propsValue.organization_fields) {
      organizationData.organization.organization_fields = propsValue.organization_fields;
    }

    const response = await httpClient.sendRequest<{ organization: Record<string, unknown> }>({
      url: `https://${subdomain}.zendesk.com/api/v2/organizations/${propsValue.organization_id}.json`,
      method: HttpMethod.PUT,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: {
        organization: organizationData,
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 