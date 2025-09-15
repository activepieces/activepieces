import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createCampaignAction = createAction({
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Creates a new campaign',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      required: true,
      options: {
        options: [
          { label: 'Outbound Call', value: 'outbound_call' },
        ],
      },
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    interval: Property.Number({
      displayName: 'Interval',
      required: true,
    }),
    widget_id: Property.ShortText({
      displayName: 'Widget ID',
      description: 'The UUID of the widget',
      required: false,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'not_started' },
          { label: 'To Be Run', value: 'to_be_run' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Paused', value: 'paused' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    execution_weekdays: Property.Array({
      displayName: 'Execution Weekdays',
      description: 'Array of integers representing weekdays (e.g., [1, 2, 3] for Mon, Tue, Wed)',
      required: false,
    }),
    time_window_start: Property.ShortText({
      displayName: 'Time Window Start',
      description: 'Time in HH:MM format',
      required: false,
    }),
    time_window_end: Property.ShortText({
      displayName: 'Time Window End',
      description: 'Time in HH:MM format',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      required: false,
      defaultValue: 'UTC',
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      name,
      type,
      start_time,
      interval,
      widget_id,
      attributes,
      status,
      execution_weekdays,
      time_window_start,
      time_window_end,
      time_zone,
      enabled,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const url = `https://api.insighto.ai/api/v1/campaign/create`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
    };

    const body: any = {
      name,
      type,
      start_time,
      interval,
    };

    if (widget_id) body.widget_id = widget_id;
    if (attributes) body.attributes = attributes;
    if (status) body.status = status;
    if (execution_weekdays) body.execution_weekdays = execution_weekdays;
    if (time_window_start) body.time_window_start = time_window_start;
    if (time_window_end) body.time_window_end = time_window_end;
    if (time_zone) body.time_zone = time_zone;
    if (enabled !== undefined) body.enabled = enabled;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      queryParams,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
