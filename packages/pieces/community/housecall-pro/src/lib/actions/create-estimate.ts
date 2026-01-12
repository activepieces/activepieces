import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createEstimate = createAction({
  auth: housecallProAuth,
  name: "create_estimate",
  displayName: "Create estimate",
  description: "Create an estimate",
  props: {
    estimate_number: Property.Number({
      displayName: "Estimate Number",
      required: false,
      description:
        "Unique estimate number. If blank, one will be automatically generated.",
    }),
    message: Property.ShortText({
      displayName: "Note Message",
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: "Customer ID",
      required: false,
    }),
    assigned_employee_ids: Property.Array({
      displayName: "Assigned Employee IDs",
      required: false,
    }),
    address_id: Property.ShortText({
      displayName: "Address ID",
      required: false,
    }),
    address: Property.Json({
      displayName: "Address",
      required: false,
      description: "Address object with fields: street, street_line_2, city, state, zip",
    }),
    schedule: Property.Json({
      displayName: "Schedule",
      required: false,
      description: "Schedule object with fields: start_time, end_time, arrival_window_in_minutes, notify_customer",
    }),
    estimate_fields: Property.Json({
      displayName: "Estimate Fields",
      required: false,
      description: "Estimate fields object with: job_type_id, business_unit_id",
    }),
    options: Property.Array({
      displayName: "Options (array of option objects)",
      required: false,
      description: "Each option object corresponds to an estimate option to create.",
    }),
    additional_fields: Property.Json({
      displayName: "Additional Fields (advanced)",
      required: false,
      description: "Advanced: provide raw fields merged into the request body.",
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};

    if (propsValue["estimate_number"] !== undefined)
      body["estimate_number"] = propsValue["estimate_number"];
    if (propsValue["message"]) body["note"] = { message: propsValue["message"] };
    if (propsValue["customer_id"]) body["customer_id"] = propsValue["customer_id"];
    if (propsValue["assigned_employee_ids"]) body["assigned_employee_ids"] = propsValue["assigned_employee_ids"];
    if (propsValue["address_id"]) body["address_id"] = propsValue["address_id"];
    if (propsValue["address"]) body["address"] = propsValue["address"];
    if (propsValue["schedule"]) body["schedule"] = propsValue["schedule"];
    if (propsValue["estimate_fields"]) body["estimate_fields"] = propsValue["estimate_fields"];
    if (propsValue["options"]) body["options"] = propsValue["options"];
    if (propsValue["additional_fields"]) Object.assign(body, propsValue["additional_fields"]);

    const response = await makeHousecallProRequest(
      auth,
      "/estimates",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});


