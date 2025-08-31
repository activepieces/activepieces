import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

interface ZendeskTicket {
  id: number;
  subject: string;
  status: string;
  type?: string;
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

interface ZendeskBrand {
  id: number;
  name: string;
  subdomain: string;
  active: boolean;
  default: boolean;
  created_at: string;
  updated_at: string;
}

interface ZendeskBrandsResponse {
  brands: ZendeskBrand[];
}

interface ZendeskCustomRole {
  id: number;
  name: string;
  description: string;
  role_type: number;
  team_member_count: number;
  created_at: string;
  updated_at: string;
}

interface ZendeskCustomRolesResponse {
  custom_roles: ZendeskCustomRole[];
}

interface ZendeskGroup {
  id: number;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface ZendeskGroupsResponse {
  groups: ZendeskGroup[];
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
      const response =
        await httpClient.sendRequest<ZendeskOrganizationsResponse>({
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
          organizations.length === 0
            ? 'No organizations available'
            : 'Select an organization',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
          label: `${user.name}${user.email ? ` (${user.email})` : ''} - ID: ${
            user.id
          }${user.role ? ` [${user.role}]` : ''}`,
          value: user.id.toString(),
        })),
        placeholder:
          users.length === 0 ? 'No users available' : 'Select a user',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading users: ${errorMessage}`,
      };
    }
  },
});

export const brandIdDropdown = Property.Dropdown({
  displayName: 'Brand',
  description: 'Select the brand to work with',
  required: false,
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
      const response = await httpClient.sendRequest<ZendeskBrandsResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/brands.json`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const brands = response.body.brands;

      return {
        disabled: false,
        options: brands
          .filter((brand) => brand.active)
          .map((brand) => ({
            label: `${brand.name}${brand.default ? ' (Default)' : ''} - ${
              brand.subdomain
            }`,
            value: brand.id.toString(),
          })),
        placeholder:
          brands.length === 0 ? 'No brands available' : 'Select a brand',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading brands: ${errorMessage}`,
      };
    }
  },
});

export const problemTicketIdDropdown = Property.Dropdown({
  displayName: 'Problem Ticket',
  description: 'Select the problem ticket this ticket is an incident of',
  required: false,
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

      const problemTickets = tickets.filter(
        (ticket) => ticket.type === 'problem'
      );

      return {
        disabled: false,
        options: problemTickets.map((ticket) => ({
          label: `#${ticket.id} - ${ticket.subject} (${ticket.status})`,
          value: ticket.id.toString(),
        })),
        placeholder:
          problemTickets.length === 0
            ? 'No problem tickets available'
            : 'Select a problem ticket',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading problem tickets: ${errorMessage}`,
      };
    }
  },
});

export const customRoleIdDropdown = Property.Dropdown({
  displayName: 'Custom Role',
  description: 'Select the custom role for the agent',
  required: false,
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
      const response = await httpClient.sendRequest<ZendeskCustomRolesResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/custom_roles.json`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const customRoles = response.body.custom_roles;

      return {
        disabled: false,
        options: customRoles.map((role) => ({
          label: `${role.name} - ${role.description} (${role.team_member_count} members)`,
          value: role.id.toString(),
        })),
        placeholder:
          customRoles.length === 0 ? 'No custom roles available' : 'Select a custom role',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading custom roles: ${errorMessage}`,
      };
    }
  },
});

export const agentBrandIdDropdown = Property.MultiSelectDropdown({
  displayName: 'Agent Brand Access',
  description: 'Select the brands that the agent can access (for agents only)',
  required: false,
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
      const response = await httpClient.sendRequest<ZendeskBrandsResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/brands.json`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const brands = response.body.brands;

      return {
        disabled: false,
        options: brands
          .filter((brand) => brand.active) // Only show active brands
          .map((brand) => ({
            label: `${brand.name}${brand.default ? ' (Default)' : ''} - ${brand.subdomain}`,
            value: brand.id.toString(),
          })),
        placeholder:
          brands.length === 0 ? 'No brands available' : 'Select brands for agent access',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading brands: ${errorMessage}`,
      };
    }
  },
});

export const groupIdDropdown = Property.Dropdown({
  displayName: 'Group',
  description: 'Select the group to assign',
  required: false,
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
      const response = await httpClient.sendRequest<ZendeskGroupsResponse>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/groups.json?per_page=100`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const groups = response.body.groups;

      return {
        disabled: false,
        options: groups.map((group) => ({
          label: `${group.name}${group.is_public ? ' (Public)' : ' (Private)'} - ID: ${group.id}`,
          value: group.id.toString(),
        })),
        placeholder:
          groups.length === 0 ? 'No groups available' : 'Select a group',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading groups: ${errorMessage}`,
      };
    }
  },
});

