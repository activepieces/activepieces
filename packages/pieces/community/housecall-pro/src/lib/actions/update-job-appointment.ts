import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const updateJobAppointment = createAction({
  auth: housecallProAuth,
  name: "update_job_appointment",
  displayName: "Update Appointment",
  description: "Update job appointment",
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
    start_time: Property.DateTime({
      displayName: "Start Time",
      description: "Start time of job appointment in iso8601",
      required: true,
    }),
    end_time: Property.DateTime({
      displayName: "End Time",
      description: "End time of job appointment in iso8601",
      required: true,
    }),
    arrival_window_minutes: Property.Number({
      displayName: "Arrival Window (minutes)",
      description: "Integer value in minutes of arrival window",
      required: false,
    }),
    dispatched_employees_ids: Property.Array({
      displayName: "Dispatched Employees IDs",
      description: "List of pros ids to be assign in appointment",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      start_time: propsValue['start_time'],
      end_time: propsValue['end_time'],
      dispatched_employees_ids: propsValue['dispatched_employees_ids'],
    };

    if (propsValue['arrival_window_minutes'] !== undefined) {
      body['arrival_window_minutes'] = propsValue['arrival_window_minutes'];
    }

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/appointments/${propsValue['appointment_id']}`,
      HttpMethod.PUT,
      body
    );

    return response.body;
  },
});
