import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const fetchAvailability = createAction({
  auth: zohoBookingsAuth,
  name: 'fetchAvailability',
  displayName: 'Fetch Availability',
  description: 'Fetch availability of appointments across services',
  props: {
    workspace_id: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace to fetch availability for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Authentication required',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const workspaces = await zohoBookingsCommon.fetchWorkspaces(
            (auth as any).access_token,
            location
          );

          return {
            options: workspaces.map((workspace: any) => ({
              label: workspace.name,
              value: workspace.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load workspaces',
            options: [],
          };
        }
      },
    }),
    service_id: Property.Dropdown({
      displayName: 'Service',
      description: 'Select the service for which availability is to be fetched',
      required: true,
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!workspace_id || !auth) {
          return {
            disabled: true,
            placeholder: 'Please enter workspace ID first',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const services = await zohoBookingsCommon.fetchServices(
            (auth as any).access_token,
            location,
            workspace_id as string
          );

          return {
            options: services.map((service: any) => ({
              label: `${service.name} (${service.duration})`,
              value: service.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load services',
            options: [],
          };
        }
      },
    }),
    staff_id: Property.Dropdown({
      displayName: 'Staff',
      description: 'Select the staff member (use this OR group_id OR resource_id)',
      required: false,
      refreshers: ['service_id'],
      options: async ({ auth, service_id }) => {
        if (!service_id || !auth) {
          return {
            disabled: true,
            placeholder: 'Please select service first',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const staff = await zohoBookingsCommon.fetchStaff(
            (auth as any).access_token,
            location,
            service_id as string
          );

          return {
            options: staff.map((member: any) => ({
              label: `${member.name} - ${member.designation || 'Staff'}`,
              value: member.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load staff',
            options: [],
          };
        }
      },
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'The unique ID of the staff group associated with the service (use this OR staff_id OR resource_id)',
      required: false,
    }),
    resource_id: Property.Dropdown({
      displayName: 'Resource',
      description: 'Select the resource (use this OR staff_id OR group_id)',
      required: false,
      refreshers: ['service_id'],
      options: async ({ auth, service_id }) => {
        if (!service_id || !auth) {
          return {
            disabled: true,
            placeholder: 'Please select service first',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const resources = await zohoBookingsCommon.fetchResources(
            (auth as any).access_token,
            location,
            service_id as string
          );

          return {
            options: resources.map((resource: any) => ({
              label: resource.name,
              value: resource.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load resources',
            options: [],
          };
        }
      },
    }),
    selected_date: Property.DateTime({
      displayName: 'Selected Date',
      description: 'The date on which services are checked for availability (format: dd-MMM-yyyy HH:mm:ss)',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(propsValue, zohoBookingsCommon.fetchAvailabilitySchema);

    // Validate that at least one of staff_id, group_id, or resource_id is provided
    if (!propsValue.staff_id && !propsValue.group_id && !propsValue.resource_id) {
      throw new Error('Either staff_id, group_id, or resource_id must be provided');
    }

    // Format date to YYYY-MM-DD format
    const formatDate = (date: string) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {
      service_id: propsValue.service_id,
      selected_date: formatDate(propsValue.selected_date),
    };

    // Add the staff/group/resource ID (only one should be provided)
    if (propsValue.staff_id) {
      queryParams['staff_id'] = propsValue.staff_id;
    }
    if (propsValue.group_id) {
      queryParams['group_id'] = propsValue.group_id;
    }
    if (propsValue.resource_id) {
      queryParams['resource_id'] = propsValue.resource_id;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoBookingsCommon.baseUrl(location)}/availableslots`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
      queryParams,
    });

    return response.body;
  },
});