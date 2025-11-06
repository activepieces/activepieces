import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJob = createAction({
  auth: housecallProAuth,
  name: "get_job",
  displayName: "Get a Job",
  description: "Retrieves a single job by ID from Housecall Pro.",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to retrieve",
      required: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      description: "Expand related data (attachments, appointments)",
      required: false,
      options: {
        options: [
          { label: "Attachments", value: "attachments" },
          { label: "Appointments", value: "appointments" },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue['expand'] && propsValue['expand'].length > 0) {
      queryParams['expand'] = propsValue['expand'].join(',');
    }

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}`,
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});

