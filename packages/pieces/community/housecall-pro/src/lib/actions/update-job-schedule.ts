import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const updateJobSchedule = createAction({
  auth: housecallProAuth,
  name: "update_job_schedule",
  displayName: "Update Job Schedule",
  description: "Updates a job's schedule. Jobs with multi days feature containing more than 1 appointment can't be updated through this action.",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to update schedule for",
      required: true,
    }),
    start_time: Property.ShortText({
      displayName: "Start Time",
      description: "Start time of job in ISO8601 format (e.g., 2021-01-14T20:14:00)",
      required: true,
    }),
    end_time: Property.ShortText({
      displayName: "End Time",
      description: "End time of job in ISO8601 format (e.g., 2021-01-14T21:14:00)",
      required: true,
    }),
    arrival_window_in_minutes: Property.Number({
      displayName: "Arrival Window (minutes)",
      description: "Integer value in minutes of arrival window",
      required: false,
    }),
    notify: Property.Checkbox({
      displayName: "Notify",
      description: "Notify the customer of the update schedule",
      required: false,
      defaultValue: true,
    }),
    notify_pro: Property.Checkbox({
      displayName: "Notify Pro",
      description: "Notify the pros of the update schedule",
      required: false,
      defaultValue: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      description: "Expand related entities",
      required: false,
      options: {
        options: [
          { label: "Assigned Employees", value: "assigned_employees" },
        ],
      },
    }),
    dispatched_employees: Property.Array({
      displayName: "Dispatched Employees",
      description: "Array of employee objects with employee_id",
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const scheduleData: Record<string, any> = {
      start_time: propsValue['start_time'],
      end_time: propsValue['end_time'],
    };

    if (propsValue['arrival_window_in_minutes'] !== undefined) {
      scheduleData['arrival_window_in_minutes'] = propsValue['arrival_window_in_minutes'];
    }
    if (propsValue['notify'] !== undefined) {
      scheduleData['notify'] = propsValue['notify'];
    }
    if (propsValue['notify_pro'] !== undefined) {
      scheduleData['notify_pro'] = propsValue['notify_pro'];
    }
    if (propsValue['expand'] && propsValue['expand'].length > 0) {
      scheduleData['expand'] = propsValue['expand'].join(',');
    }
    if (propsValue['dispatched_employees'] && propsValue['dispatched_employees'].length > 0) {
      scheduleData['dispatched_employees'] = propsValue['dispatched_employees'];
    }

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/schedule`,
      HttpMethod.PUT,
      scheduleData
    );

    return response.body;
  },
});

