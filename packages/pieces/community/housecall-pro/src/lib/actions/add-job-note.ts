import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const addJobNote = createAction({
  auth: housecallProAuth,
  name: "add_job_note",
  displayName: "Add job note",
  description: "Add a note to a job",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    content: Property.LongText({
      displayName: "Content",
      description: "The content of the note",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      content: propsValue['content'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/notes`,
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
