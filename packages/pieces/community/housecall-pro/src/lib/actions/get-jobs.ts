import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobs = createAction({
  auth: housecallProAuth,
  name: 'get_jobs',
  displayName: 'Get Jobs',
  description: 'Retrieve a list of jobs from Housecall Pro.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filters jobs by a single customer ID',
      required: false,
    }),
    employee_ids: Property.Array({
      displayName: 'Employee IDs',
      description: 'Array of employee IDs to filter jobs',
      required: false,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Expand',
      description: 'Array of strings to expand response body',
      required: false,
      options: {
        options: [
          { label: 'Attachments', value: 'attachments' },
          { label: 'Appointments', value: 'appointments' },
        ],
      },
    }),
    location_ids: Property.Array({
      displayName: 'Location IDs',
      description: 'IDs of locations to retrieve jobs from',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The paginated page number',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'The number of jobs returned per page',
      required: false,
      defaultValue: 10,
    }),
    scheduled_start_min: Property.DateTime({
      displayName: 'Scheduled Start Min',
      description: 'Filters jobs with a starting time greater than or equal to the date sent',
      required: false,
    }),
    scheduled_start_max: Property.DateTime({
      displayName: 'Scheduled Start Max',
      description: 'Filters jobs with a starting time less than or equal to the date sent',
      required: false,
    }),
    scheduled_end_min: Property.DateTime({
      displayName: 'Scheduled End Min',
      description: 'Filters jobs with an end time greater than or equal to the date sent',
      required: false,
    }),
    scheduled_end_max: Property.DateTime({
      displayName: 'Scheduled End Max',
      description: 'Filters jobs with an end time less than or equal to the date sent',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'The attribute to sort the results by',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Invoice Number', value: 'invoice_number' },
          { label: 'ID', value: 'id' },
          { label: 'Description', value: 'description' },
          { label: 'Work Status', value: 'work_status' },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'The sorting order',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
      defaultValue: 'desc',
    }),
    work_status: Property.StaticMultiSelectDropdown({
      displayName: 'Work Status',
      description: 'Filters jobs by their work status. If empty, returns jobs from all statuses',
      required: false,
      options: {
        options: [
          { label: 'Unscheduled', value: 'unscheduled' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue['customer_id']) {
      queryParams['customer_id'] = propsValue['customer_id'];
    }
    if (propsValue['employee_ids'] && propsValue['employee_ids'].length > 0) {
      queryParams['employee_ids'] = (propsValue['employee_ids'] as string[]).join(',');
    }
    if (propsValue['expand'] && propsValue['expand'].length > 0) {
      queryParams['expand'] = propsValue['expand'].join(',');
    }
    if (propsValue['location_ids'] && propsValue['location_ids'].length > 0) {
      queryParams['location_ids'] = (propsValue['location_ids'] as string[]).join(',');
    }
    if (propsValue['page']) {
      queryParams['page'] = propsValue['page'].toString();
    }
    if (propsValue['page_size']) {
      queryParams['page_size'] = propsValue['page_size'].toString();
    }
    if (propsValue['scheduled_start_min']) {
      queryParams['scheduled_start_min'] = propsValue['scheduled_start_min'];
    }
    if (propsValue['scheduled_start_max']) {
      queryParams['scheduled_start_max'] = propsValue['scheduled_start_max'];
    }
    if (propsValue['scheduled_end_min']) {
      queryParams['scheduled_end_min'] = propsValue['scheduled_end_min'];
    }
    if (propsValue['scheduled_end_max']) {
      queryParams['scheduled_end_max'] = propsValue['scheduled_end_max'];
    }
    if (propsValue['sort_by']) {
      queryParams['sort_by'] = propsValue['sort_by'];
    }
    if (propsValue['sort_direction']) {
      queryParams['sort_direction'] = propsValue['sort_direction'];
    }
    if (propsValue['work_status'] && propsValue['work_status'].length > 0) {
      queryParams['work_status'] = (propsValue['work_status'] as string[]).join(',');
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
