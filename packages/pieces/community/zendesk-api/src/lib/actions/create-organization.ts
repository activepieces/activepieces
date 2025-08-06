import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const createOrganization = createAction({
  auth: zendeskApiAuth,
  name: 'create_organization',
  displayName: 'Create Organization',
  description: 'Create a new organization record',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'The name of the organization (must be unique)',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external ID for the organization',
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Domain names associated with the organization',
      required: false,
      of: Property.ShortText({
        displayName: 'Domain Name',
        description: 'A domain name (e.g., company.com)',
        required: true,
      }),
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the organization',
      required: false,
      of: Property.ShortText({
        displayName: 'Tag',
        description: 'A tag for the organization',
        required: true,
      }),
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'The ID of the group associated with the organization',
      required: false,
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description: 'Whether tickets are shared within the organization',
      required: false,
      defaultValue: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description: 'Whether comments are shared within the organization',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    const organizationData: any = {
      name: propsValue.name,
    };

    // Add optional fields if provided
    if (propsValue.details) organizationData.details = propsValue.details;
    if (propsValue.notes) organizationData.notes = propsValue.notes;
    if (propsValue.external_id) organizationData.external_id = propsValue.external_id;
    if (propsValue.domain_names && propsValue.domain_names.length > 0) {
      organizationData.domain_names = propsValue.domain_names;
    }
    if (propsValue.tags && propsValue.tags.length > 0) {
      organizationData.tags = propsValue.tags;
    }
    if (propsValue.group_id) organizationData.group_id = propsValue.group_id;
    if (propsValue.shared_tickets !== undefined) {
      organizationData.shared_tickets = propsValue.shared_tickets;
    }
    if (propsValue.shared_comments !== undefined) {
      organizationData.shared_comments = propsValue.shared_comments;
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/organizations.json`,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: {
        organization: organizationData,
      },
    });

    return response.body;
  },
});