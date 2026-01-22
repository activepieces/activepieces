import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getLeads = createAction({
  auth: housecallProAuth,
  name: "get_leads",
  displayName: "Get Leads",
  description: "Get a list of leads",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "Filter leads by a single customer ID (String)",
      required: false,
    }),
    employee_ids: Property.Array({
      displayName: "Employee IDs",
      description: "Filter leads by a list of employee IDs (String array)",
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: "Lead Source",
      description: "Filter leads by a single lead_source",
      required: false,
    }),
    location_ids: Property.Array({
      displayName: "Location IDs",
      description: "If a location you want to get from / If a Company-kit header is set, location_ids will be ignored",
      required: false,
    }),
    page: Property.Number({
      displayName: "Page",
      description: "Paginated page number",
      required: false,
    }),
    page_size: Property.Number({
      displayName: "Page Size",
      description: "Number of leads returned per page",
      required: false,
    }),
    sort_by: Property.ShortText({
      displayName: "Sort By",
      description: "Attribute to sort by",
      required: false,
    }),
    sort_direction: Property.ShortText({
      displayName: "Sort Direction",
      description: "Allowed values: asc, desc",
      required: false,
    }),
    status: Property.ShortText({
      displayName: "Status",
      description: "Filter leads by status",
      required: false,
    }),
    tag_ids: Property.Array({
      displayName: "Tag IDs",
      description: "Filter leads by a list of tags",
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string | number | undefined> = {};

    if (propsValue['customer_id']) {
      queryParams['customer_id'] = propsValue['customer_id'];
    }
    if (propsValue['employee_ids'] && propsValue['employee_ids'].length > 0) {
      queryParams['employee_ids'] = (propsValue['employee_ids'] as string[]).join(',');
    }
    if (propsValue['lead_source']) {
      queryParams['lead_source'] = propsValue['lead_source'];
    }
    if (propsValue['location_ids'] && propsValue['location_ids'].length > 0) {
      queryParams['location_ids'] = (propsValue['location_ids'] as string[]).join(',');
    }
    if (propsValue['page'] !== undefined) {
      queryParams['page'] = propsValue['page'];
    }
    if (propsValue['page_size'] !== undefined) {
      queryParams['page_size'] = propsValue['page_size'];
    }
    if (propsValue['sort_by']) {
      queryParams['sort_by'] = propsValue['sort_by'];
    }
    if (propsValue['sort_direction']) {
      queryParams['sort_direction'] = propsValue['sort_direction'];
    }
    if (propsValue['status']) {
      queryParams['status'] = propsValue['status'];
    }
    if (propsValue['tag_ids'] && propsValue['tag_ids'].length > 0) {
      queryParams['tag_ids'] = (propsValue['tag_ids'] as string[]).join(',');
    }

    const response = await makeHousecallProRequest(
      auth,
      '/leads',
      HttpMethod.GET,
      undefined,
      queryParams as Record<string, string>
    );

    return response.body;
  },
});
