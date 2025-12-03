import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getEstimates = createAction({
  auth: housecallProAuth,
  name: "get_estimates",
  displayName: "Get estimates",
  description: "Get a list of estimates with filtering and pagination",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "Filter estimates by a single customer ID",
      required: false,
    }),
    employee_ids: Property.Array({
      displayName: "Employee IDs",
      description: "Filter estimates by assigned employee IDs",
      required: false,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      description: "Array of strings to expand response body",
      required: false,
      options: {
        options: [
          { label: "Customer", value: "customer" },
          { label: "Address", value: "address" },
          { label: "Assigned Employees", value: "assigned_employees" },
          { label: "Options", value: "options" },
          { label: "Attachments", value: "attachments" },
        ],
      },
    }),
    location_ids: Property.Array({
      displayName: "Location IDs",
      description: "IDs of locations to retrieve estimates from",
      required: false,
    }),
    page: Property.Number({
      displayName: "Page",
      description: "The paginated page number",
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: "Page Size",
      description: "The number of estimates returned per page",
      required: false,
      defaultValue: 50,
    }),
    scheduled_end_max: Property.DateTime({
      displayName: "Scheduled End Max",
      description: "Filters estimates with an end time less than or equal to the date sent",
      required: false,
    }),
    scheduled_end_min: Property.DateTime({
      displayName: "Scheduled End Min",
      description: "Filters estimates with an end time greater than or equal to the date sent",
      required: false,
    }),
    scheduled_start_max: Property.DateTime({
      displayName: "Scheduled Start Max",
      description: "Filters estimates with a starting time less than or equal to the date sent",
      required: false,
    }),
    scheduled_start_min: Property.DateTime({
      displayName: "Scheduled Start Min",
      description: "Filters estimates with a starting time greater than or equal to the date sent",
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: "Sort By",
      description: "The attribute to sort the results by",
      required: false,
      options: {
        options: [
          { label: "Created At", value: "created_at" },
          { label: "Updated At", value: "updated_at" },
          { label: "ID", value: "id" },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: "Sort Direction",
      description: "The sorting order",
      required: false,
      options: {
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
      },
    }),
    work_status: Property.StaticMultiSelectDropdown({
      displayName: "Work Status",
      description: "Filters estimates by their work status",
      required: false,
      options: {
        options: [
          { label: "Unscheduled", value: "unscheduled" },
          { label: "Scheduled", value: "scheduled" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Canceled", value: "canceled" },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.customer_id) {
      queryParams['customer_id'] = String(propsValue.customer_id);
    }
    if (propsValue.scheduled_end_max) {
      queryParams['scheduled_end_max'] = String(propsValue.scheduled_end_max);
    }
    if (propsValue.scheduled_end_min) {
      queryParams['scheduled_end_min'] = String(propsValue.scheduled_end_min);
    }
    if (propsValue.scheduled_start_max) {
      queryParams['scheduled_start_max'] = String(propsValue.scheduled_start_max);
    }
    if (propsValue.scheduled_start_min) {
      queryParams['scheduled_start_min'] = String(propsValue.scheduled_start_min);
    }
    if (propsValue.sort_by) {
      queryParams['sort_by'] = String(propsValue.sort_by);
    }
    if (propsValue.sort_direction) {
      queryParams['sort_direction'] = String(propsValue.sort_direction);
    }
    if (propsValue.employee_ids && propsValue.employee_ids.length) {
      queryParams['employee_ids'] = propsValue.employee_ids.join(",");
    }
    if (propsValue.location_ids && propsValue.location_ids.length) {
      queryParams['location_ids'] = propsValue.location_ids.join(",");
    }
    if (propsValue.expand && propsValue.expand.length) {
      queryParams['expand'] = propsValue.expand.join(",");
    }
    if (propsValue.work_status && propsValue.work_status.length) {
      queryParams['work_status'] = propsValue.work_status.join(",");
    }
    if (propsValue.page) {
      queryParams['page'] = String(propsValue.page);
    }
    if (propsValue.page_size) {
      queryParams['page_size'] = String(propsValue.page_size);
    }

    const response = await makeHousecallProRequest(
      auth,
      "/estimates",
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});


