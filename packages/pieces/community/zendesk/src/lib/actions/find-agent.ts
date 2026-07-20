import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

interface ZendeskAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  ticket_restriction?: string;
}

interface ZendeskUsersResponse {
  users: ZendeskAgent[];
}

export const findAgentAction = createAction({
  auth: zendeskAuth,
  name: 'find-agent',
  displayName: 'Find an Agent',
  description: 'Find an agent (staff member) by email or name.',
  audience: 'both',
  aiMetadata: { description: 'Finds an agent (staff/support team member) in Zendesk by searching for their email or name. Returns the first matching agent with their profile details. Useful for assigning tickets or sending notifications to specific agents.', idempotent: true },
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Choose how to search for the agent',
      required: true,
      options: {
        disabled: false,
        placeholder: 'Select search method',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Name', value: 'name' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The email or name to search for',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const { search_type, search_value } = propsValue;

    if (!search_value || search_value.trim() === '') {
      throw new Error('Search value is required');
    }

    try {
      const response = await httpClient.sendRequest<ZendeskUsersResponse>({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/users.json?role=agent&per_page=100`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
      });

      const agents = response.body.users || [];

      let matchedAgent: ZendeskAgent | undefined;

      if (search_type === 'email') {
        matchedAgent = agents.find(
          (agent) => agent.email && agent.email.toLowerCase() === search_value.toLowerCase()
        );
      } else {
        matchedAgent = agents.find(
          (agent) => agent.name && agent.name.toLowerCase().includes(search_value.toLowerCase())
        );
      }

      if (!matchedAgent) {
        throw new Error(
          `No agent found with ${search_type} containing "${search_value}"`
        );
      }

      return {
        success: true,
        agent: matchedAgent,
        id: matchedAgent.id,
        name: matchedAgent.name,
        email: matchedAgent.email,
        role: matchedAgent.role,
        active: matchedAgent.active,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API credentials and permissions.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw error;
    }
  },
});
