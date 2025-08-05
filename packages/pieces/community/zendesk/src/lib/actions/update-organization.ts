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

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const updateOrganizationAction = createAction({
  auth: zendeskAuth,
  name: 'update-organization',
  displayName: 'Update Organization',
  description: 'Update existing organization fields.',
  props: {
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'The ID of the organization to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Update the name of the organization (must be unique)',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Update additional details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Update internal notes about the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Update the external ID for the organization',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Organization URL',
      description: 'Update the organization\'s website URL',
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Update domain names associated with the organization. Note: This will replace ALL existing domain names.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Update tags applied to the organization. This will replace all existing tags.',
      required: false,
    }),
    organization_fields: Property.Json({
      displayName: 'Organization Fields',
      description: 'Update custom organization field values as JSON object. Example: {"field_key": "value"}',
      required: false,
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description: 'Update whether users in this organization can see each other\'s tickets',
      required: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description: 'Update whether users in this organization can see each other\'s comments',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      organization_id,
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

    // Build the organization update object
    const organization: Record<string, unknown> = {};

    // Add name with trimming if provided
    if (name !== undefined && name !== null && name !== '') {
      organization.name = name.trim();
    }

    // Add optional parameters
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

    // Add organization fields if provided
    if (organization_fields) {
      try {
        const orgFieldsObj = typeof organization_fields === 'string' ? JSON.parse(organization_fields) : organization_fields;
        organization.organization_fields = orgFieldsObj;
      } catch (error) {
        throw new Error('Invalid organization fields format. Expected JSON object.');
      }
    }

    // Check if there's anything to update
    if (Object.keys(organization).length === 0) {
      throw new Error('No fields provided to update. Please specify at least one field to modify.');
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/organizations/${organization_id}.json`,
        method: HttpMethod.PUT,
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
        message: 'Organization updated successfully',
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
      
      if (errorMessage.includes('404')) {
        throw new Error(
          `Organization with ID ${organization_id} not found. Please verify the organization ID.`
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

      throw new Error(`Failed to update organization: ${errorMessage}`);
    }
  },
});
