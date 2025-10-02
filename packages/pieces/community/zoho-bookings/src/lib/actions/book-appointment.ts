import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { formatDateTime, zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const bookAppointment = createAction({
  auth: zohoBookingsAuth,
  name: 'bookAppointment',
  displayName: 'Book Appointment',
  description: 'Book an appointment for a customer for a desired service',
  props: {
    workspace_id: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace for the appointment',
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
      description: 'Select the service for which the appointment is booked',
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
      description:
        'Select the staff member (use this OR resource_id OR group_id)',
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
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description:
        'The unique ID of the staff group for collective booking (use this OR staff_id OR resource_id)',
      required: false,
    }),
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'The starting time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'End time for resource booking (optional, format: dd-MMM-yyyy HH:mm:ss)',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'The timezone for the appointment (optional)',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Name of the customer',
      required: true,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email address of the customer',
      required: true,
    }),
    customer_phone: Property.ShortText({
      displayName: 'Customer Phone',
      description: 'Phone number of the customer',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information about the appointment (optional)',
      required: false,
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional customer details as JSON object (optional)',
      required: false,
    }),
    cost_paid: Property.Number({
      displayName: 'Cost Paid',
      description: 'Amount paid for the booking (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(
      propsValue,
      zohoBookingsCommon.bookAppointmentSchema
    );

    // Validate that at least one of staff_id, resource_id, or group_id is provided
    if (
      !propsValue.staff_id &&
      !propsValue.resource_id &&
      !propsValue.group_id
    ) {
      throw new Error(
        'Either staff_id, resource_id, or group_id must be provided'
      );
    }

    // Prepare customer details
    const customer_details = {
      name: String(propsValue.customer_name),
      email: String(propsValue.customer_email),
      phone_number: String(propsValue.customer_phone),
    };
    const customer_details_json = JSON.stringify(customer_details);
    // Prepare form data
    const formData = new FormData();
    formData.append('service_id', propsValue.service_id as string);
    formData.append('from_time', formatDateTime(propsValue.from_time));
    
    formData.append('customer_details', customer_details_json);

    // Add optional staff/resource/group ID
    if (propsValue.staff_id != null && propsValue.staff_id) {
      formData.append('staff_id', propsValue.staff_id as string);
    }
    if (propsValue.resource_id != null && propsValue.resource_id) {
      formData.append('resource_id', propsValue.resource_id as string);
    }
    if (propsValue.group_id != null && propsValue.group_id) {
      formData.append('group_id', propsValue.group_id as string);
    }

    // Add optional fields
    if (propsValue.to_time) {
      formData.append('to_time', formatDateTime(propsValue.to_time));
    }
    if (propsValue.timezone) {
      formData.append('timezone', propsValue.timezone);
    }
    if (propsValue.notes) {
      formData.append('notes', propsValue.notes);
    }
    if (propsValue.additional_fields) {
      formData.append(
        'additional_fields',
        JSON.stringify(propsValue.additional_fields)
      );
    }
    if (propsValue.cost_paid) {
      formData.append(
        'payment_info',
        JSON.stringify({ cost_paid: propsValue.cost_paid.toString() })
      );
    }
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoBookingsCommon.baseUrl(location)}/appointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (response.body.response.status === 'failure') {
      throw new Error(`${response.body.response.errormessage}`);
    }
    return response.body.response;
  },
});
