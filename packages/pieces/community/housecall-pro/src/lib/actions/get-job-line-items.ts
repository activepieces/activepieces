import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobLineItems = createAction({
  auth: housecallProAuth,
  name: "get_job_line_items",
  displayName: "Lists all line items for a job",
  description: "Retrieve all line items for a specific job",
  audience: 'both',
  aiMetadata: { description: "List every line item (services, materials, charges) on a Housecall Pro job identified by job ID. Read-only and idempotent. Use bulk-update-job-line-items to modify these line items.", idempotent: true },
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/line_items`,
      HttpMethod.GET
    );

    return response.body;
  },
});
