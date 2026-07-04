import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteJobLineItem = createAction({
  auth: housecallProAuth,
  name: "delete_job_line_item",
  displayName: "Delete a single line item for a job",
  description: "Delete a specific line item from a job",
  audience: 'both',
  aiMetadata: { description: 'Destructive: permanently removes one line item from a Housecall Pro job, identified by the job ID and line item ID. Use only when you intend to delete that specific item; not safe to blindly retry, as a repeat call after success will error because the item no longer exists. Affects only the named line item, not the whole job.', idempotent: false },
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    id: Property.ShortText({
      displayName: "Line Item ID",
      description: "The ID of the line item to delete",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/line_items/${propsValue['id']}`,
      HttpMethod.DELETE
    );

    return response.body;
  },
});
