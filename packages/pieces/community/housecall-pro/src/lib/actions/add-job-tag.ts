import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const addJobTag = createAction({
  auth: housecallProAuth,
  name: "add_job_tag",
  displayName: "Add job tag",
  description: "Add a tag to a job",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    tag_id: Property.ShortText({
      displayName: "Tag ID",
      description: "The ID of the tag to add",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      tag_id: propsValue['tag_id'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/tags`,
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
