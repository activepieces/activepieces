import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const lockJob = createAction({
  auth: housecallProAuth,
  name: "lock_job",
  displayName: "Lock Job",
  description: "Lock the job identified by the given job_id",
  audience: 'both',
  aiMetadata: {
    description: "Lock a Housecall Pro job by its job ID, preventing further edits. Targets a stable job ID, so re-running on an already-locked job is harmless.",
    idempotent: true,
  },
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to lock",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/lock`,
      HttpMethod.POST
    );

    return response.body;
  },
});
