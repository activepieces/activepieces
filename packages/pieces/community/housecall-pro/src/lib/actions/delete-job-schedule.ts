import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteJobSchedule = createAction({
  auth: housecallProAuth,
  name: "delete_job_schedule",
  displayName: "Delete Job Schedule",
  description: "Deletes schedule on a job.",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to delete schedule from.",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/schedule`,
      HttpMethod.DELETE
    );

    return response.body;
  },
});

