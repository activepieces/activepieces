import { createAction, Property, OAuth2PropertyValue, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const createTimeTrackingAction = createAction({
  auth: bexioAuth,
  name: 'create_time_tracking',
  displayName: 'Create Time Tracking',
  description: 'Create a new timesheet entry',
  props: {
    user_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'User',
      description: 'User for this timesheet entry',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try { 
          const client = new BexioClient(auth);
          const users = await client.get<Array<{
            id: number;
            firstname?: string | null;
            lastname?: string | null;
            email: string;
          }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => {
              const name = user.firstname && user.lastname
                ? `${user.firstname} ${user.lastname}`
                : user.email;
              return {
                label: name,
                value: user.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
            options: [],
          };
        }
      },
    }),
    status_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Status',
      description: 'Timesheet status',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          // TODO: Need to confirm endpoint - assuming /2.0/timesheet_status
          const statuses = await client.get<Array<{ id: number; name: string }>>('/2.0/timesheet_status').catch(() => []);

          return {
            disabled: false,
            options: statuses.map((status) => ({
              label: status.name,
              value: status.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load timesheet statuses',
            options: [],
          };
        }
      },
    }),
    client_service_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Client Service',
      description: 'Business activity/client service',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          // TODO: Need to confirm endpoint - assuming /2.0/client_service
          const services = await client.get<Array<{ id: number; name: string }>>('/2.0/client_service').catch(() => []);

          return {
            disabled: false,
            options: services.map((service) => ({
              label: service.name,
              value: service.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load client services',
            options: [],
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Description',
      description: 'Description of the work performed',
      required: false,
    }),
    allowable_bill: Property.Checkbox({
      displayName: 'Allowable Bill',
      description: 'Whether this time is billable',
      required: true,
      defaultValue: true,
    }),
    charge: Property.ShortText({
      displayName: 'Charge',
      description: 'Charge amount',
      required: false,
    }),
    contact_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact',
      description: 'Contact associated with this timesheet',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    sub_contact_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Sub Contact',
      description: 'Sub contact (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    pr_project_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Project',
      description: 'Project associated with this timesheet',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const projects = await client.get<Array<{
            id: number;
            name: string;
            nr?: string;
          }>>('/2.0/pr_project');

          return {
            disabled: false,
            options: projects.map((project) => ({
              label: project.nr ? `${project.name} (#${project.nr})` : project.name,
              value: project.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load projects',
            options: [],
          };
        }
      },
    }),
    pr_package_id: Property.Number({
      displayName: 'Package ID',
      description: 'Project package ID',
      required: false,
    }),
    pr_milestone_id: Property.Number({
      displayName: 'Milestone ID',
      description: 'Project milestone ID',
      required: false,
    }),
    estimated_time: Property.ShortText({
      displayName: 'Estimated Time',
      description: 'Estimated time (format: HH:MM)',
      required: false,
    }),
    tracking_type: Property.StaticDropdown({
      displayName: 'Tracking Type',
      description: 'Type of time tracking',
      required: true,
      defaultValue: 'duration',
      options: {
        disabled: false,
        options: [
          { label: 'Duration', value: 'duration' },
          { label: 'Range', value: 'range' },
        ],
      },
    }),
    tracking_details: Property.DynamicProperties({
      auth: bexioAuth,  
      displayName: 'Tracking Details',
      description: 'Time tracking details',
      required: true,
      refreshers: ['tracking_type'],
      props: async ({ tracking_type }) => {
        const type = (tracking_type as unknown as string) || 'duration';
        const dynamicProps: Record<string, any> = {};

        if (type === 'duration') {
          dynamicProps['date'] = Property.ShortText({
            displayName: 'Date',
            description: 'Date of the timesheet entry (YYYY-MM-DD)',
            required: true,
          });
          dynamicProps['duration'] = Property.ShortText({
            displayName: 'Duration',
            description: 'Duration of time tracked (format: HH:MM)',
            required: true,
          });
        } else {
          // Range type
          dynamicProps['from'] = Property.DateTime({
            displayName: 'From',
            description: 'Start date and time',
            required: true,
          });
          dynamicProps['to'] = Property.DateTime({
            displayName: 'To',
            description: 'End date and time',
            required: true,
          });
        }

        return dynamicProps;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const props = propsValue;

    const requestBody: Record<string, unknown> = {
      user_id: props['user_id'],
      client_service_id: props['client_service_id'],
      allowable_bill: props['allowable_bill'],
    };

    if (props['status_id']) {
      requestBody['status_id'] = props['status_id'];
    }
    if (props['text']) {
      requestBody['text'] = props['text'];
    }
    if (props['charge']) {
      requestBody['charge'] = props['charge'];
    }
    if (props['contact_id']) {
      requestBody['contact_id'] = props['contact_id'];
    }
    if (props['sub_contact_id']) {
      requestBody['sub_contact_id'] = props['sub_contact_id'];
    }
    if (props['pr_project_id']) {
      requestBody['pr_project_id'] = props['pr_project_id'];
    }
    if (props['pr_package_id']) {
      requestBody['pr_package_id'] = props['pr_package_id'];
    }
    if (props['pr_milestone_id']) {
      requestBody['pr_milestone_id'] = props['pr_milestone_id'];
    }
    if (props['estimated_time']) {
      requestBody['estimated_time'] = props['estimated_time'];
    }

    // Build tracking object
    const trackingType = props['tracking_type'] as string;
    const trackingDetails = props['tracking_details'] as DynamicPropsValue;
    const tracking: Record<string, unknown> = {
      type: trackingType,
    };

    if (trackingType === 'duration') {
      tracking['date'] = trackingDetails['date'];
      tracking['duration'] = trackingDetails['duration'];
    } else {
      // Range type
      tracking['from'] = trackingDetails['from'];
      tracking['to'] = trackingDetails['to'];
    }

    requestBody['tracking'] = tracking;

    const response = await client.post<{
      id: number;
      user_id: number;
      client_service_id: number;
      tracking: {
        type: string;
        date?: string;
        duration?: string;
        from?: string;
        to?: string;
      };
    }>('/2.0/timesheet', requestBody);

    return response;
  },
});

