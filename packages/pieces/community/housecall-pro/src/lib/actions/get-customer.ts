import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomer = createAction({
  auth: housecallProAuth,
  name: "get_customer",
  displayName: "Get Customer",
  description: "Retrieves the customer by ID.",
  audience: 'both',
  aiMetadata: {
    description: "Fetch one Housecall Pro customer by its customer ID, optionally expanding attachments and do-not-service status. Read-only and repeatable. Requires a known customer ID; it does not search by name or email.",
    idempotent: true,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "The ID of the customer to retrieve.",
      required: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      description: "Expand related data",
      required: false,
      options: {
        options: [
          { label: "Attachments", value: "attachments" },
          { label: "Do Not Service", value: "do_not_service" },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue.expand && propsValue.expand.length > 0) {
      queryParams["expand"] = propsValue.expand.join(",");
    }

    const response = await makeHousecallProRequest(
      auth,
      `/customers/${propsValue.customer_id}`,
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});

