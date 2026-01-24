import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { z } from "zod";
import { propsValidation } from "@activepieces/pieces-common";

export const updateCustomer = createAction({
  auth: housecallProAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Updates an existing customer in Housecall Pro.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to update.',
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
    mobile_number: Property.ShortText({
      displayName: 'Mobile Number',
      required: false,
    }),
    home_number: Property.ShortText({
      displayName: 'Home Number',
      required: false,
    }),
    work_number: Property.ShortText({
      displayName: 'Work Number',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
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
    notifications_enabled: Property.Checkbox({
      displayName: 'Notifications Enabled',
      description: 'Will the customer receive notifications',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'Array of address objects (if provided, each address must include an id)',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().email().optional(),
      mobile_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      home_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      work_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    });

    const { customer_id, ...updateData } = propsValue;

    // Remove undefined values to avoid sending empty strings
    const cleanUpdateData: Record<string, any> = {};
    (Object.keys(updateData) as Array<keyof typeof updateData>).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        cleanUpdateData[key] = updateData[key];
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
