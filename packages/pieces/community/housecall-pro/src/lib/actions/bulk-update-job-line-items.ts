import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const bulkUpdateJobLineItems = createAction({
  auth: housecallProAuth,
  name: "bulk_update_job_line_items",
  displayName: "Bulk update a job's line items",
  description: "Bulk update job line items. If upsert not define for a line item it will be considered as a new line item for the job.",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    line_items: Property.Array({
      displayName: "Line Items",
      description: "Array of line items to update",
      required: true,
    }),
    append_line_items: Property.Checkbox({
      displayName: "Append Line Items",
      description: "Append line items to the job",
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      line_items: propsValue['line_items'],
    };

    if (propsValue['append_line_items'] !== undefined) {
      body['append_line_items'] = propsValue['append_line_items'];
    }

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/line_items/bulk_update`,
      HttpMethod.PUT,
      body
    );

    return response.body;
  },
});
