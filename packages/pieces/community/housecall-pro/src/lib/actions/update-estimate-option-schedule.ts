import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const updateEstimateOptionSchedule = createAction({
  auth: housecallProAuth,
  name: "update_estimate_option_schedule",
  displayName: "Update estimate option schedule",
  description: "Update an estimate option's schedule.",
  props: {
    estimate_id: Property.ShortText({ displayName: "Estimate ID", required: true }),
    option_id: Property.ShortText({ displayName: "Option ID", required: true }),
    start_time: Property.DateTime({ displayName: "Start Time", required: true }),
    end_time: Property.DateTime({ displayName: "End Time", required: true }),
    arrival_window_in_minutes: Property.Number({ displayName: "Arrival Window (minutes)", required: true }),
    notify: Property.Checkbox({ displayName: "Notify Customer", required: true, defaultValue: true }),
    notify_pro: Property.Checkbox({ displayName: "Notify Pro", required: true, defaultValue: true }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: "Expand",
      required: false,
      options: { options: [{ label: "Assigned Employees", value: "assigned_employees" }] },
    }),
    dispatched_employees: Property.Array({
      displayName: "Dispatched Employees",
      required: false,
      description: "Array of objects with employee_id",
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      start_time: propsValue["start_time"],
      end_time: propsValue["end_time"],
    };
    body["arrival_window_in_minutes"] = propsValue["arrival_window_in_minutes"] ?? 0;
    body["notify"] = propsValue["notify"] ?? true;
    body["notify_pro"] = propsValue["notify_pro"] ?? true;
    if (propsValue["expand"] && propsValue["expand"].length) {
      body["expand"] = propsValue["expand"].join(",");
    }
    if (propsValue["dispatched_employees"]) {
      body["dispatched_employees"] = propsValue["dispatched_employees"];
    }

    const response = await makeHousecallProRequest(
      auth,
      `/estimates/${propsValue["estimate_id"]}/options/${propsValue["option_id"]}/schedule`,
      HttpMethod.PUT,
      body
    );
    return response.body;
  },
});


