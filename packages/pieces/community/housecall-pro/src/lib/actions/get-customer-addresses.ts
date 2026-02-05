import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomerAddresses = createAction({
  auth: housecallProAuth,
  name: "get_customer_addresses",
  displayName: "Get All of a Customer's Addresses",
  description: "Retrieves all of a customer's addresses.",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "The ID of the customer",
      required: true,
    }),
    page: Property.Number({
      displayName: "Page",
      description: "Paginated page number",
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: "Page Size",
      description: "Number of addresses returned per page",
      required: false,
      defaultValue: 50,
    }),
    sort_by: Property.StaticDropdown({
      displayName: "Sort By",
      description: "Address attribute to sort by",
      required: false,
      options: {
        options: [
          { label: "Created At", value: "created_at" },
          { label: "Updated At", value: "updated_at" },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: "Sort Direction",
      description: "Ascending or descending",
      required: false,
      options: {
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {
      page: String(propsValue.page || 1),
      page_size: String(propsValue.page_size || 50),
    };

    if (propsValue.sort_by) {
      queryParams["sort_by"] = propsValue.sort_by;
    }
    if (propsValue.sort_direction) {
      queryParams["sort_direction"] = propsValue.sort_direction;
    }

    const response = await makeHousecallProRequest(
      auth,
      `/customers/${propsValue.customer_id}/addresses`,
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});

