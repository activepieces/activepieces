import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createJobLink = createAction({
  auth: housecallProAuth,
  name: "create_job_link",
  displayName: "Create Job Link",
  description: "Create a new job link",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    title: Property.ShortText({
      displayName: "Title",
      description: "The title of the link",
      required: true,
    }),
    url: Property.ShortText({
      displayName: "URL",
      description: "The URL of the link",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      title: propsValue['title'],
      url: propsValue['url'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/links`,
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
