import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from './auth';

export const dynamicProps = {
  // Organizations dropdown
  organizations: Property.Dropdown({
    displayName: 'Organization',
    required: true,
    auth: gauzyAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/organization`,
          headers,
        });

        const organizations = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: organizations.map((org: any) => ({
            label: org.name || org.officialName || `Organization ${org.id}`,
            value: org.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load organizations'
        };
      }
    },
  }),

  // Roles dropdown
  roles: Property.Dropdown({
    displayName: 'Role',
    required: false,
    auth: gauzyAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/role`,
          headers,
        });

        const roles = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: roles.map((role: any) => ({
            label: role.name || `Role ${role.id}`,
            value: role.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load roles'
        };
      }
    },
  }),

  // Projects dropdown
  projects: Property.Dropdown({
    displayName: 'Project',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/organization-project?organizationId=${organizationId}`,
          headers,
        });

        const projects = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: projects.map((project: any) => ({
            label: project.name || `Project ${project.id}`,
            value: project.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load projects'
        };
      }
    },
  }),

  // Task Statuses dropdown
  taskStatuses: Property.Dropdown({
    displayName: 'Task Status',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/task-status?organizationId=${organizationId}`,
          headers,
        });

        const statuses = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: statuses.map((status: any) => ({
            label: status.name || status.value || `Status ${status.id}`,
            value: status.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load task statuses'
        };
      }
    },
  }),

  // Task Priorities dropdown
  taskPriorities: Property.Dropdown({
    displayName: 'Task Priority',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/task-priority?organizationId=${organizationId}`,
          headers,
        });

        const priorities = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: priorities.map((priority: any) => ({
            label: priority.name || priority.value || `Priority ${priority.id}`,
            value: priority.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load task priorities'
        };
      }
    },
  }),

  // Task Sizes dropdown
  taskSizes: Property.Dropdown({
    displayName: 'Task Size',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/task-size?organizationId=${organizationId}`,
          headers,
        });

        const sizes = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: sizes.map((size: any) => ({
            label: size.name || size.value || `Size ${size.id}`,
            value: size.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load task sizes'
        };
      }
    },
  }),

  // Employees dropdown
  employees: Property.Dropdown({
    displayName: 'Employee',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/employee?organizationId=${organizationId}`,
          headers,
        });

        const employees = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: employees.map((employee: any) => ({
            label: `${employee.user?.firstName || employee.firstName || ''} ${employee.user?.lastName || employee.lastName || ''}`.trim() || employee.user?.email || employee.email || `Employee ${employee.id}`,
            value: employee.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load employees'
        };
      }
    },
  }),

  // Teams dropdown
  teams: Property.Dropdown({
    displayName: 'Team',
    required: false,
    auth: gauzyAuth,
    refreshers: ['organizationId'],
    options: async ({ auth, organizationId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gauzy account first'
        };
      }

      if (!organizationId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an organization first'
        };
      }

      try {
        const baseUrl = getBaseUrl(auth as OAuth2PropertyValue);
        const headers = getAuthHeaders(auth as OAuth2PropertyValue);

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/api/organization-team?organizationId=${organizationId}`,
          headers,
        });

        const teams = Array.isArray(response.body) ? response.body : response.body.items || [];

        return {
          options: teams.map((team: any) => ({
            label: team.name || `Team ${team.id}`,
            value: team.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load teams'
        };
      }
    },
  }),
};
