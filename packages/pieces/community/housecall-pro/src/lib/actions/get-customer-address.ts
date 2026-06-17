import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomerAddress = createAction({
  auth: housecallProAuth,
  name: "get_customer_address",
  displayName: "Get a Customer's Address",
  description: "Retrieves a customer's address by customer ID and address ID.",
  audience: 'both',
  aiMetadata: { description: 'Read-only: fetches a single customer address in Housecall Pro by its customer ID and address ID. Use when both IDs are known and you need the details of one specific address; safe to retry. Does not list all addresses for a customer and does not modify any data.', idempotent: true },
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

