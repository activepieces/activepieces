import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobAppointments = createAction({
  auth: housecallProAuth,
  name: "get_job_appointments",
  displayName: "Get Appointments",
  description: "Get all of the appointments for a job",
  audience: 'both',
  aiMetadata: { description: "List all appointments scheduled on a Housecall Pro job identified by job ID. Read-only and idempotent. Use create-appointment or update-appointment to modify scheduling.", idempotent: true },
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
