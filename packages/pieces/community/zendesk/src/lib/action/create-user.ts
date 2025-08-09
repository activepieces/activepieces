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

export const createUser = createAction({
  auth: zendeskAuth,
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
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role of the user. If creating an agent with a custom role, set this to "agent" and provide custom_role_id',
      required: false,
      options: {
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    custom_role_id: Property.ShortText({
      displayName: 'Custom Role ID',
      description: 'The ID of the custom role for agents. Required when creating agents with specific roles',
      required: false,
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization for this user',
      required: false,
    }),
    organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'The name of the organization to create or assign to this user',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the user',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'The time zone of the user (e.g., UTC)',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'The locale of the user (e.g., en-us)',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'External ID for the user',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for the user',
      required: false,
    }),
    user_fields: Property.Json({
      displayName: 'User Fields',
      description: 'Custom user fields (JSON format)',
      required: false,
    }),
    agent_brand_ids: Property.Array({
      displayName: 'Agent Brand IDs',
      description: 'Array of brand IDs to assign the agent to',
      required: false,
    }),
    identities: Property.Json({
      displayName: 'Identities',
      description: 'Array of user identities (JSON format). Example: [{"type": "email", "value": "test@user.com"}, {"type": "twitter", "value": "username"}]',
      required: false,
    }),
    skip_verify_email: Property.Checkbox({
      displayName: 'Skip Verification Email',
      description: 'Skip sending verification email to the user',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const userData: { user: Record<string, unknown> } = {
      user: {
        name: propsValue.name,
        email: propsValue.email,
      },
    };

    // Add optional fields if provided
    if (propsValue.role) {
      userData.user.role = propsValue.role;
    }

    if (propsValue.custom_role_id) {
      userData.user.custom_role_id = parseInt(propsValue.custom_role_id);
    }

    // Handle organization - prefer organization object over ID if both are provided
    if (propsValue.organization_name) {
      userData.user.organization = {
        name: propsValue.organization_name,
      };
    } else if (propsValue.organization_id) {
      userData.user.organization_id = parseInt(propsValue.organization_id);
    }

    if (propsValue.phone) {
      userData.user.phone = propsValue.phone;
    }

    if (propsValue.time_zone) {
      userData.user.time_zone = propsValue.time_zone;
    }

    if (propsValue.locale) {
      userData.user.locale = propsValue.locale;
    }

    if (propsValue.external_id) {
      userData.user.external_id = propsValue.external_id;
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      userData.user.tags = propsValue.tags;
    }

    if (propsValue.user_fields) {
      userData.user.user_fields = propsValue.user_fields;
    }

    if (propsValue.agent_brand_ids && propsValue.agent_brand_ids.length > 0) {
      userData.user.agent_brand_ids = propsValue.agent_brand_ids.map((id: unknown) => parseInt(id as string));
    }

    if (propsValue.identities) {
      userData.user.identities = propsValue.identities;
    }

    if (propsValue.skip_verify_email) {
      userData.user.skip_verify_email = propsValue.skip_verify_email;
    }

    const response = await httpClient.sendRequest<{ user: Record<string, unknown> }>({
      url: `https://${subdomain}.zendesk.com/api/v2/users.json`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: userData,
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 