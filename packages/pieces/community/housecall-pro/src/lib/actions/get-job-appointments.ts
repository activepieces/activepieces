import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobAppointments = createAction({
  auth: housecallProAuth,
  name: "get_job_appointments",
  displayName: "Get Appointments",
  description: "Get all of the appointments for a job",
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
      `/jobs/${propsValue['job_id']}/appointments`,
      HttpMethod.GET
    );

    return response.body;
  },
});
