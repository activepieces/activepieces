import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest, HousecallProCustomer } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { z } from "zod";
import { propsValidation } from "@activepieces/pieces-common";

export const updateCustomer = createAction({
  auth: housecallProAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Update an existing customer in Housecall Pro.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'The ID of the customer to update',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
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
      description: 'Array of tags to assign to the customer (replaces existing tags)',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().email().optional(),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    });

    const { customer_id, ...updateData } = propsValue;

    // Remove undefined values to avoid sending empty strings
    const cleanUpdateData: Partial<HousecallProCustomer> = {};
    (Object.keys(updateData) as Array<keyof typeof updateData>).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        (cleanUpdateData as any)[key] = updateData[key];
      }
    });

    const response = await makeHousecallProRequest(
      auth,
      `/customers/${customer_id}`,
      HttpMethod.PUT,
      cleanUpdateData
    );

    return response.body;
  },
});
