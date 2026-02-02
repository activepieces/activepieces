import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteJobAppointment = createAction({
  auth: housecallProAuth,
  name: "delete_job_appointment",
  displayName: "Delete appointment",
  description: "Delete a job appointment",
  props: {
    appointment_id: Property.ShortText({
      displayName: "Appointment ID",
      description: "The ID of the appointment",
      required: true,
    }),
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/appointments/${propsValue['appointment_id']}`,
      HttpMethod.DELETE
    );

    return response.body;
  },
});
