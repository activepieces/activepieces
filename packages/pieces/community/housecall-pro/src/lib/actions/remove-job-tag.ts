import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const removeJobTag = createAction({
  auth: housecallProAuth,
  name: "remove_job_tag",
  displayName: "Remove job tag",
  description: "Remove a tag from a job",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    tag_id: Property.ShortText({
      displayName: "Tag ID",
      description: "The ID of the tag to remove",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/tags/${propsValue['tag_id']}`,
      HttpMethod.DELETE
    );

    return response.body;
  },
});
