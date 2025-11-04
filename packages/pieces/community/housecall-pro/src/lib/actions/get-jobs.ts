import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobs = createAction({
  auth: housecallProAuth,
  name: 'get_jobs',
  displayName: 'Get Jobs',
  description: 'Retrieve a list of jobs from Housecall Pro.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Filter jobs by customer ID',
      required: false,
    }),
    work_status: Property.StaticMultiSelectDropdown({
      displayName: 'Work Status',
      description: 'Filter jobs by work status',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    scheduled_date_from: Property.DateTime({
      displayName: 'Scheduled From',
      description: 'Filter jobs scheduled from this date (ISO 8601 format)',
      required: false,
    }),
    scheduled_date_to: Property.DateTime({
      displayName: 'Scheduled To',
      description: 'Filter jobs scheduled until this date (ISO 8601 format)',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts from 1)',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of jobs per page (max 100)',
      required: false,
      defaultValue: 50,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: [
          { label: 'Created Date (Newest First)', value: 'created_at_desc' },
          { label: 'Created Date (Oldest First)', value: 'created_at_asc' },
          { label: 'Updated Date (Newest First)', value: 'updated_at_desc' },
          { label: 'Updated Date (Oldest First)', value: 'updated_at_asc' },
          { label: 'Scheduled Date (Earliest First)', value: 'scheduled_date_asc' },
          { label: 'Scheduled Date (Latest First)', value: 'scheduled_date_desc' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      page: (propsValue.page || 1).toString(),
      page_size: (propsValue.page_size || 50).toString(),
    };

    if (propsValue.customer_id) {
      queryParams['customer_id'] = propsValue.customer_id.toString();
    }

    if (propsValue.work_status && propsValue.work_status.length > 0) {
      queryParams['work_status'] = propsValue.work_status.join(',');
    }

    if (propsValue.scheduled_date_from) {
      queryParams['scheduled_date_from'] = propsValue.scheduled_date_from;
    }

    if (propsValue.scheduled_date_to) {
      queryParams['scheduled_date_to'] = propsValue.scheduled_date_to;
    }

    if (propsValue.sort_by) {
      const sortMapping: Record<string, string> = {
        'created_at_desc': 'created_at',
        'created_at_asc': 'created_at',
        'updated_at_desc': 'updated_at',
        'updated_at_asc': 'updated_at',
        'scheduled_date_asc': 'scheduled_date',
        'scheduled_date_desc': 'scheduled_date',
      };

      const directionMapping: Record<string, string> = {
        'created_at_desc': 'desc',
        'created_at_asc': 'asc',
        'updated_at_desc': 'desc',
        'updated_at_asc': 'asc',
        'scheduled_date_asc': 'asc',
        'scheduled_date_desc': 'desc',
      };

      queryParams['sort_by'] = sortMapping[propsValue.sort_by];
      queryParams['sort_direction'] = directionMapping[propsValue.sort_by];
    }

    const response = await makeHousecallProRequest(
      auth,
      '/jobs',
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});
