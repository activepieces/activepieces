import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createJobAppointment = createAction({
  auth: housecallProAuth,
  name: "create_job_appointment",
  displayName: "Create appointment",
  description: "Add an appointment to a job",
  props: {
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
      `/jobs/${propsValue['job_id']}/appointments`,
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
