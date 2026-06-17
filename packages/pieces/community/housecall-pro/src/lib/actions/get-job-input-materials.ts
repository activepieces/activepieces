import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobInputMaterials = createAction({
  auth: housecallProAuth,
  name: "get_job_input_materials",
  displayName: "Lists all job input materials for a job",
  description: "Retrieve all job input materials for a specific job",
  audience: 'both',
  aiMetadata: { description: 'Read-only: lists all input materials recorded on a Housecall Pro job, given a job ID. Use to inspect the materials/line costs logged against a known job; safe to retry. Requires the job_id and does not add or change materials.', idempotent: true },
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
      `/jobs/${propsValue['job_id']}/job_input_materials`,
      HttpMethod.GET
    );

    return response.body;
  },
});
