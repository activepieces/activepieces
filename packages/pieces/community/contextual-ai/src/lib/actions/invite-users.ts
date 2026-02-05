import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';

export const inviteUsersAction = createAction({
  auth: contextualAiAuth,
  name: 'invite_users',
  displayName: 'Invite Users',
  description: 'Invite new users to the Contextual AI workspace',
  props: {
    users: Property.Array({
      displayName: 'Users to Invite',
      description: 'List of users to invite',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Email address of the user to invite',
          required: true,
        }),
      },
    }),
    tenantShortName: Property.ShortText({
      displayName: 'Tenant Short Name',
      description: 'The short name of the tenant/workspace',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const { users, tenantShortName } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const newUsers = users.map((user: any) => ({
      email: user.email,
      agent_level_roles: ['AGENT_LEVEL_USER' as const],
    }));

    const response = await client.users.invite({
      new_users: newUsers,
      tenant_short_name: tenantShortName,
    });

    return {
      invited_users: response.invited_user_emails,
      errors: response.error_details,
      total_invited: response.invited_user_emails.length,
      total_errors: Object.keys(response.error_details).length,
    };
  },
});
