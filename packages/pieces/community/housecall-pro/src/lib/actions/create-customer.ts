import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { z } from "zod";
import { propsValidation } from "@activepieces/pieces-common";
import { MarkdownVariant } from "@activepieces/shared";

export const createCustomer = createAction({
  auth: housecallProAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Housecall Pro.',
  props: {
    info:Property.MarkDown({
      value:'At least one of: First Name, Last Name, Email, Mobile Number, Home Number, Work Number is required.',
      variant:MarkdownVariant.INFO
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
    notifications_enabled: Property.Checkbox({
      displayName: 'Notifications Enabled',
      description: 'Will the customer receive notifications',
      required: false,
      defaultValue: true,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
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
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
      description: 'Array of address objects',
    }),
  },

  async run({ auth, propsValue }) {
    // Validate that at least one required field is provided
    const hasRequiredField = 
      propsValue['first_name'] || 
      propsValue['last_name'] || 
      propsValue['email'] || 
      propsValue['mobile_number'] || 
      propsValue['home_number'] || 
      propsValue['work_number'];

    if (!hasRequiredField) {
      throw new Error('At least one of: First Name, Last Name, Email, Mobile Number, Home Number, Work Number is required');
    }

    await propsValidation.validateZod(propsValue, {
      email: z.string().email().optional(),
      mobile_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      home_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      work_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    });

    const customerData: Record<string, any> = {};

    if (propsValue['first_name']) customerData['first_name'] = propsValue['first_name'];
    if (propsValue['last_name']) customerData['last_name'] = propsValue['last_name'];
    if (propsValue['email']) customerData['email'] = propsValue['email'];
    if (propsValue['mobile_number']) customerData['mobile_number'] = propsValue['mobile_number'];
    if (propsValue['home_number']) customerData['home_number'] = propsValue['home_number'];
    if (propsValue['work_number']) customerData['work_number'] = propsValue['work_number'];
    if (propsValue['company']) customerData['company'] = propsValue['company'];
    if (propsValue['notifications_enabled'] !== undefined) customerData['notifications_enabled'] = propsValue['notifications_enabled'];
    if (propsValue['lead_source']) customerData['lead_source'] = propsValue['lead_source'];
    if (propsValue['notes']) customerData['notes'] = propsValue['notes'];
    if (propsValue['tags']) customerData['tags'] = propsValue['tags'] as string[];
    if (propsValue['addresses']) customerData['addresses'] = propsValue['addresses'];

    const response = await makeHousecallProRequest(
      auth,
      '/customers',
      HttpMethod.POST,
      customerData
    );

    return response.body;
  },
});
