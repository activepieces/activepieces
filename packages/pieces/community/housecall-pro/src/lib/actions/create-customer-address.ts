import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createCustomerAddress = createAction({
  auth: housecallProAuth,
  name: "create_customer_address",
  displayName: "Create an Address on a Customer",
  description: "Creates an address on a customer.",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "The ID of the customer to add address to",
      required: true,
    }),
    street: Property.ShortText({
      displayName: "Street",
      description: "Street address",
      required: true,
    }),
    street_line_2: Property.ShortText({
      displayName: "Street Line 2",
      description: "Additional street address line",
      required: false,
    }),
    city: Property.ShortText({
      displayName: "City",
      description: "City",
      required: true,
    }),
    state: Property.ShortText({
      displayName: "State",
      description: "State",
      required: true,
    }),
    zip: Property.ShortText({
      displayName: "ZIP",
      description: "ZIP code",
      required: true,
    }),
    country: Property.ShortText({
      displayName: "Country",
      description: "Country",
      required: true,
    }),
    latitude: Property.Number({
      displayName: "Latitude",
      description: "Latitude (one of number)",
      required: false,
    }),
    longitude: Property.Number({
      displayName: "Longitude",
      description: "Longitude (one of number)",
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const addressData: Record<string, any> = {
      street: propsValue.street,
      city: propsValue.city,
      state: propsValue.state,
      zip: propsValue.zip,
      country: propsValue.country,
    };

    if (propsValue.street_line_2) {
      addressData["street_line_2"] = propsValue.street_line_2;
    }
    if (propsValue.latitude !== undefined) {
      addressData["latitude"] = propsValue.latitude;
    }
    if (propsValue.longitude !== undefined) {
      addressData["longitude"] = propsValue.longitude;
    }

    const response = await makeHousecallProRequest(
      auth,
      `/customers/${propsValue.customer_id}/addresses`,
      HttpMethod.POST,
      addressData
    );

    return response.body;
  },
});

