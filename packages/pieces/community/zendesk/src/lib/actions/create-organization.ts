import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

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
      description: 'The name of the organization (required and must be unique)',
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
      description: 'External ID for the organization (useful for integrations)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Organization URL',
      description: "The organization's website URL",
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Array of domain names associated with the organization',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to apply to the organization',
      required: false,
    }),
    organization_fields: Property.Json({
      displayName: 'Organization Fields',
      description:
        'Custom organization field values as JSON object. Example: {"field_key": "value"}',
      required: false,
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description:
        "Whether users in this organization can see each other's tickets",
      required: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description:
        "Whether users in this organization can see each other's comments",
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
      url,
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
      url,
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

    if (organization_fields) {
      try {
        const orgFieldsObj =
          typeof organization_fields === 'string'
            ? JSON.parse(organization_fields)
            : organization_fields;
        organization.organization_fields = orgFieldsObj;
      } catch (error) {
        throw new Error(
          'Invalid organization fields format. Expected JSON object.'
        );
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
