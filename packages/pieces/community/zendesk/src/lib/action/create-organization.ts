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

export const createOrganization = createAction({
  auth: zendeskAuth,
  name: 'create_organization',
  displayName: 'Create Organization',
  description: 'Create a new organization record',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the organization',
      required: true,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Domain names associated with the organization',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'External ID for the organization',
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

    const organizationData: { organization: Record<string, unknown> } = {
      organization: {
        name: propsValue.name,
      },
    };

    // Add optional fields if provided
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
      url: `https://${subdomain}.zendesk.com/api/v2/organizations.json`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: organizationData,
    });

    return response.body;
  },
}); 