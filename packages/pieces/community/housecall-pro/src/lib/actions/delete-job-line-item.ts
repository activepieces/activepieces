import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteJobLineItem = createAction({
  auth: housecallProAuth,
  name: "delete_job_line_item",
  displayName: "Delete a single line item for a job",
  description: "Delete a specific line item from a job",
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
