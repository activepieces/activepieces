import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteJobNote = createAction({
  auth: housecallProAuth,
  name: "delete_job_note",
  displayName: "Delete job note",
  description: "Delete a specific job note",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    note_id: Property.ShortText({
      displayName: "Note ID",
      description: "The ID of the note to delete",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/notes/${propsValue['note_id']}`,
      HttpMethod.DELETE
    );

    return response.body;
  },
});
