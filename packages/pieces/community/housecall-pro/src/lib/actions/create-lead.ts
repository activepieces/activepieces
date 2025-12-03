import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createLead = createAction({
  auth: housecallProAuth,
  name: "create_lead",
  displayName: "Create Lead",
  description: "Create a lead with the ID for an already existing customer.",
  props: {
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      description: "Either the ID of customer required",
      required: true,
    }),
    customer: Property.Object({
      displayName: "Customer",
      description: "Either the ID of customer required",
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: "First Name",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: "Last Name",
      required: false,
    }),
    email: Property.ShortText({
      displayName: "Email",
      required: false,
    }),
    notifications_enabled: Property.Checkbox({
      displayName: "Notifications Enabled",
      description: "Will the customer receive notifications",
      required: false,
    }),
    mobile_number: Property.ShortText({
      displayName: "Mobile Number",
      required: false,
    }),
    home_number: Property.ShortText({
      displayName: "Home Number",
      required: false,
    }),
    work_number: Property.ShortText({
      displayName: "Work Number",
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: "Lead Source",
      required: false,
    }),
    notes: Property.LongText({
      displayName: "Notes",
      required: false,
    }),
    tags: Property.Array({
      displayName: "Tags",
      required: false,
    }),
    addresses: Property.Array({
      displayName: "Addresses",
      required: false,
    }),
    assigned_employees: Property.Array({
      displayName: "Assigned Employees",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const leadData: Record<string, any> = {};

    if (propsValue['customer_id']) {
      leadData['customer_id'] = propsValue['customer_id'];
    }
    if (propsValue['customer']) {
      leadData['customer'] = propsValue['customer'];
    }
    if (propsValue['first_name']) {
      leadData['first_name'] = propsValue['first_name'];
    }
    if (propsValue['last_name']) {
      leadData['last_name'] = propsValue['last_name'];
    }
    if (propsValue['email']) {
      leadData['email'] = propsValue['email'];
    }
    if (propsValue['notifications_enabled'] !== undefined) {
      leadData['notifications_enabled'] = propsValue['notifications_enabled'];
    }
    if (propsValue['mobile_number']) {
      leadData['mobile_number'] = propsValue['mobile_number'];
    }
    if (propsValue['home_number']) {
      leadData['home_number'] = propsValue['home_number'];
    }
    if (propsValue['work_number']) {
      leadData['work_number'] = propsValue['work_number'];
    }
    if (propsValue['lead_source']) {
      leadData['lead_source'] = propsValue['lead_source'];
    }
    if (propsValue['notes']) {
      leadData['notes'] = propsValue['notes'];
    }
    if (propsValue['tags'] && propsValue['tags'].length > 0) {
      leadData['tags'] = propsValue['tags'];
    }
    if (propsValue['addresses'] && propsValue['addresses'].length > 0) {
      leadData['addresses'] = propsValue['addresses'];
    }
    if (propsValue['assigned_employees'] && propsValue['assigned_employees'].length > 0) {
      leadData['assigned_employees'] = propsValue['assigned_employees'];
    }

    const response = await makeHousecallProRequest(
      auth,
      '/leads',
      HttpMethod.POST,
      leadData
    );

    return response.body;
  },
});
