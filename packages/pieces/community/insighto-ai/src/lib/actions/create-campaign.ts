import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { InsightoAuth } from "../common/auth";
import { WidgetDropdown } from "../common/dropdown";
import { makeRequest } from "../common/client";



export const CreateCampaign = createAction({
  auth: InsightoAuth,
  name: "create_campaign",
  displayName: "Create Campaign",
  description: "Create a new campaign in Insighto.ai",
  props: {
    name: Property.ShortText({
      displayName: "Campaign Name",
      description: "Name of the campaign",
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: "Campaign Type",
      description: "Type of campaign",
      required: true,
      options: {
        options: [{ label: "Outbound Call", value: "outbound_call" }],
      },
    }),
    startTime: Property.DateTime({
      displayName: "Start Time",
      description: "When the campaign should start",
      required: true,
    }),
    interval: Property.Number({
      displayName: "Interval",
      description: "Interval between executions (in seconds)",
      required: true,
    }),
    widgetId: WidgetDropdown, 
    attributes: Property.Object({
      displayName: "Attributes",
      description: "Additional attributes for the campaign",
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: "Status",
      description: "Initial status of the campaign",
      required: false,
      options: {
        options: [
          { label: "Not Started", value: "not_started" },
          { label: "To Be Run", value: "to_be_run" },
          { label: "In Progress", value: "in_progress" },
          { label: "Paused", value: "paused" },
          { label: "Cancelled", value: "cancelled" },
          { label: "Completed", value: "completed" },
        ],
      },
    }),
    executionWeekdays: Property.Array({
      displayName: "Execution Weekdays",
      description:
        "Array of weekdays (0=Sunday, 1=Monday, ... 6=Saturday) when the campaign runs",
      required: false,
    }),
    timeWindowStart: Property.ShortText({
      displayName: "Time Window Start",
      description: "Start time window (HH:mm:ss format)",
      required: false,
    }),
    timeWindowEnd: Property.ShortText({
      displayName: "Time Window End",
      description: "End time window (HH:mm:ss format)",
      required: false,
    }),
    timeZone: Property.ShortText({
      displayName: "Time Zone",
      description: "Time zone for execution (default UTC)",
      required: false,
      defaultValue: "UTC",
    }),
    enabled: Property.Checkbox({
      displayName: "Enabled",
      description: "Whether the campaign should be enabled immediately",
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      name: propsValue.name,
      type: propsValue.type,
      start_time: propsValue.startTime,
      interval: propsValue.interval,
      widget_id: propsValue.widgetId,
      attributes: propsValue.attributes,
      status: propsValue.status,
      execution_weekdays: propsValue.executionWeekdays,
      time_window_start: propsValue.timeWindowStart,
      time_window_end: propsValue.timeWindowEnd,
      time_zone: propsValue.timeZone || "UTC",
      enabled: propsValue.enabled ?? false,
    };

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      "/campaign/create",
      body
    );

    return response;
  },
});
