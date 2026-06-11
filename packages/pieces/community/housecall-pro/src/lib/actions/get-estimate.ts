import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getEstimate = createAction({
  auth: housecallProAuth,
  name: "get_estimate",
  displayName: "Get estimate by ID",
  description: "Retrieve a single estimate by ID",
  audience: 'both',
  aiMetadata: { description: "Fetch a single Housecall Pro estimate by its ID, optionally expanding related customer, address, assigned-employees, options, or attachments inline. Read-only and idempotent. Use the get-estimates list action instead when you need to search or filter across multiple estimates rather than look one up by known ID.", idempotent: true },
  props: {
    estimate_id: Property.ShortText({
      displayName: "Estimate ID",
      required: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      required: false,
      options: {
        options: [
          { label: "customer", value: "customer" },
          { label: "address", value: "address" },
          { label: "assigned_employees", value: "assigned_employees" },
          { label: "options", value: "options" },
          { label: "attachments", value: "attachments" },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue["expand"] && propsValue["expand"].length) {
      queryParams["expand"] = propsValue["expand"].join(",");
    }

    const response = await makeHousecallProRequest(
      auth,
      `/estimates/${propsValue["estimate_id"]}`,
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});


