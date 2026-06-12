import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const addJobTag = createAction({
  auth: housecallProAuth,
  name: "add_job_tag",
  displayName: "Add job tag",
  description: "Add a tag to a job",
  audience: 'both',
  aiMetadata: {
    description: "Attach a tag (by tag ID) to a Housecall Pro job. Effectively idempotent since adding a tag already present leaves the job's tag set unchanged. To detach a tag use Remove job tag.",
    idempotent: true,
  },
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
