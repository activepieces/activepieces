import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

interface ZendeskTicket {
  id: number;
  subject: string;
  status: string;
  requester_id: number;
  assignee_id?: number;
  created_at: string;
  updated_at: string;
}

interface ZendeskTicketsResponse {
  tickets: ZendeskTicket[];
}

interface ZendeskOrganization {
  id: number;
  name: string;
  details?: string;
  created_at: string;
  updated_at: string;
}

interface ZendeskOrganizationsResponse {
  organizations: ZendeskOrganization[];
}

interface ZendeskUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

interface ZendeskUsersResponse {
  users: ZendeskUser[];
}

export const ticketIdDropdown = Property.Dropdown({
  displayName: 'Ticket',
  description: 'Select the ticket to work with',
  required: true,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth;
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Zendesk account first',
      };
    }

    try {
      const authentication = auth as AuthProps;
      const response = await httpClient.sendRequest<ZendeskTicketsResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets.json?per_page=100`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const tickets = response.body.tickets;

      return {
        disabled: false,
        options: tickets.map((ticket) => ({
          label: `#${ticket.id} - ${ticket.subject} (${ticket.status})`,
          value: ticket.id.toString(),
        })),
        placeholder:
          tickets.length === 0 ? 'No tickets available' : 'Select a ticket',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading tickets: ${errorMessage}`,
      };
    }
  },
});

export const organizationIdDropdown = Property.Dropdown({
  displayName: 'Organization',
  description: 'Select the organization to work with',
  required: true,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth;
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Zendesk account first',
      };
    }

    try {
      const authentication = auth as AuthProps;
      const response = await httpClient.sendRequest<ZendeskOrganizationsResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/organizations.json?per_page=100`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const organizations = response.body.organizations;

      return {
        disabled: false,
        options: organizations.map((org) => ({
          label: `${org.name} (ID: ${org.id})`,
          value: org.id.toString(),
        })),
        placeholder:
          organizations.length === 0 ? 'No organizations available' : 'Select an organization',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading organizations: ${errorMessage}`,
      };
    }
  },
});

export const userIdDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select the user to work with',
  required: true,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth;
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Zendesk account first',
      };
    }

    try {
      const authentication = auth as AuthProps;
      const response = await httpClient.sendRequest<ZendeskUsersResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/users.json?per_page=100`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const users = response.body.users;

      return {
        disabled: false,
        options: users.map((user) => ({
          label: `${user.name}${user.email ? ` (${user.email})` : ''} - ID: ${user.id}${user.role ? ` [${user.role}]` : ''}`,
          value: user.id.toString(),
        })),
        placeholder:
          users.length === 0 ? 'No users available' : 'Select a user',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading users: ${errorMessage}`,
      };
    }
  },
});
