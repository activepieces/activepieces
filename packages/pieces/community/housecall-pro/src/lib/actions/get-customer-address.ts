import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomerAddress = createAction({
  auth: housecallProAuth,
  name: "get_customer_address",
  displayName: "Get a Customer's Address",
  description: "Retrieves a customer's address by customer ID and address ID.",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "The ID of the customer",
      required: true,
    }),
    address_id: Property.ShortText({
      displayName: "Address ID",
      description: "The ID of the address",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await makeHousecallProRequest(
      auth,
      `/customers/${propsValue.customer_id}/addresses/${propsValue.address_id}`,
      HttpMethod.GET
    );

    return response.body;
  },
});

