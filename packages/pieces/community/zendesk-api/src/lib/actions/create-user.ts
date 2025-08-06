import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const createUser = createAction({
  auth: zendeskApiAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Add a new user to the Zendesk instance',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the user',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the user',
      required: false,
    }),
    role: Property.Dropdown({
      displayName: 'Role',
      description: 'The role of the user (defaults to end-user if not specified)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    custom_role_id: Property.Number({
      displayName: 'Custom Role ID',
      description: 'The ID of a custom role (for agents with specific roles)',
      required: false,
    }),
    organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Name of the organization to assign the user to',
      required: false,
    }),
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'ID of the organization to assign the user to',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the user',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Details about the user',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the user',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external ID for the user',
      required: false,
    }),
    skip_verify_email: Property.Checkbox({
      displayName: 'Skip Verification Email',
      description: 'Skip sending verification email to the user',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the user',
      required: false,
      of: Property.ShortText({
        displayName: 'Tag',
        description: 'A tag for the user',
        required: true,
      }),
    }),
    agent_brand_ids: Property.Array({
      displayName: 'Agent Brand IDs',
      description: 'Brand IDs that the agent has access to (for agents only)',
      required: false,
      of: Property.Number({
        displayName: 'Brand ID',
        description: 'A brand ID',
        required: true,
      }),
    }),
    identities: Property.Array({
      displayName: 'Identities',
      description: 'Multiple identities for the user (email, twitter, etc.)',
      required: false,
      of: Property.Object({
        displayName: 'Identity',
        description: 'An identity for the user',
        required: true,
        properties: {
          type: Property.Dropdown({
            displayName: 'Type',
            description: 'The type of identity',
            required: true,
            options: {
              disabled: false,
              options: [
                { label: 'Email', value: 'email' },
                { label: 'Twitter', value: 'twitter' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'Google', value: 'google' },
                { label: 'Phone Number', value: 'phone_number' },
              ],
            },
          }),
          value: Property.ShortText({
            displayName: 'Value',
            description: 'The identity value (e.g., email address, twitter handle)',
            required: true,
          }),
        },
      }),
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    const userData: any = {
      name: propsValue.name,
    };

    // Add optional fields if provided
    if (propsValue.email) userData.email = propsValue.email;
    if (propsValue.role) userData.role = propsValue.role;
    if (propsValue.custom_role_id) userData.custom_role_id = propsValue.custom_role_id;
    if (propsValue.phone) userData.phone = propsValue.phone;
    if (propsValue.details) userData.details = propsValue.details;
    if (propsValue.notes) userData.notes = propsValue.notes;
    if (propsValue.external_id) userData.external_id = propsValue.external_id;
    if (propsValue.skip_verify_email) userData.skip_verify_email = propsValue.skip_verify_email;
    if (propsValue.tags && propsValue.tags.length > 0) userData.tags = propsValue.tags;
    if (propsValue.agent_brand_ids && propsValue.agent_brand_ids.length > 0) {
      userData.agent_brand_ids = propsValue.agent_brand_ids;
    }

    // Handle organization assignment
    if (propsValue.organization_name) {
      userData.organization = { name: propsValue.organization_name };
    } else if (propsValue.organization_id) {
      userData.organization_id = propsValue.organization_id;
    }

    // Handle identities
    if (propsValue.identities && propsValue.identities.length > 0) {
      userData.identities = propsValue.identities.map((identity: any) => ({
        type: identity.type,
        value: identity.value,
      }));
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/users.json`,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: {
        user: userData,
      },
    });

    return response.body;
  },
});