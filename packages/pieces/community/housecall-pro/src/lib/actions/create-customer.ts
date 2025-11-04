import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest, HousecallProCustomer } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { z } from "zod";
import { propsValidation } from "@activepieces/pieces-common";

export const createCustomer = createAction({
  auth: housecallProAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer in Housecall Pro.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      description: 'Array of tags to assign to the customer',
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().email().optional(),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    });

    const customerData: Partial<HousecallProCustomer> = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      email: propsValue.email,
      phone: propsValue.phone,
      mobile: propsValue.mobile,
      company: propsValue.company,
      address: propsValue.address,
      city: propsValue.city,
      state: propsValue.state,
      zip: propsValue.zip,
      notes: propsValue.notes,
      tags: propsValue.tags as string[],
    };

    const response = await makeHousecallProRequest(
      auth,
      '/customers',
      HttpMethod.POST,
      customerData
    );

    return response.body;
  },
});
