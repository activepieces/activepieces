import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const bulkUpdateJobInputMaterials = createAction({
  auth: housecallProAuth,
  name: "bulk_update_job_input_materials",
  displayName: "Bulk update a job's input materials",
  description: "Bulk update job input materials. If upsert not define for a job input material it will be consider as a new entry.",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    job_input_materials: Property.Array({
      displayName: "Job Input Materials",
      description: "Array of job input materials to update",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      job_input_materials: propsValue['job_input_materials'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/job_input_materials/bulk_update`,
      HttpMethod.PUT,
      body
    );

    return response.body;
  },
});
