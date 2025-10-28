import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WidgetItemSchema, WidgetItem } from '../schemas';

export const createCampaignAction = createAction({
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new outbound call campaign',
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
      description: 'When the campaign should start',
      required: true,
    }),
    interval: Property.Number({
      displayName: 'Interval (minutes)',
      description: 'Time between executions (e.g., 60 for hourly, 1440 for daily)',
      required: true,
    }),
    widget_id: Property.Dropdown({
      displayName: 'Widget',
      description: 'Widget to associate with this campaign',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const apiKey = auth as string;
          const url = `https://api.insighto.ai/api/v1/widget`;

          const queryParams: Record<string, string> = {
            api_key: apiKey,
            page: '1',
            size: '100', // Get more widgets for better UX
          };

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            queryParams,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = response.body.data;
          if (!data || !data.items) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No widgets found'
            };
          }

          // Validate the response data
          const validatedItems: WidgetItem[] = [];
          for (const item of data.items) {
            try {
              const parsedItem = WidgetItemSchema.parse(item);
              validatedItems.push(parsedItem);
            } catch {
              continue;
            }
          }

          const options = validatedItems.map((item) => ({
            label: `${item.name || item.display_name || 'Unnamed'} (${item.widget_type} - ${item.widget_provider || 'No Provider'})`,
            value: item.id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load widgets'
          };
        }
      },
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'Additional campaign attributes as key-value pairs',
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
      description: 'Weekdays as numbers (e.g., [1, 2, 3] for Mon, Tue, Wed)',
      required: false,
    }),
    time_window_start: Property.ShortText({
      displayName: 'Time Window Start',
      description: 'Start time in HH:MM format',
      required: false,
    }),
    time_window_end: Property.ShortText({
      displayName: 'Time Window End',
      description: 'End time in HH:MM format',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'Time zone (defaults to UTC)',
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
    try {
      const name = context.propsValue['name'];
      const type = context.propsValue['type'];
      const start_time = context.propsValue['start_time'];
      const interval = context.propsValue['interval'];
      const widget_id = context.propsValue['widget_id'];
      const attributes = context.propsValue['attributes'];
      const status = context.propsValue['status'];
      const execution_weekdays = context.propsValue['execution_weekdays'];
      const time_window_start = context.propsValue['time_window_start'];
      const time_window_end = context.propsValue['time_window_end'];
      const time_zone = context.propsValue['time_zone'];
      const enabled = context.propsValue['enabled'];

      if (!name) {
        throw new Error('Campaign name is required');
      }

      if (!type) {
        throw new Error('Campaign type is required');
      }

      if (!start_time) {
        throw new Error('Start time is required');
      }

      if (!interval || interval <= 0) {
        throw new Error('Interval must be a positive number');
      }

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

      if (!response.body) {
        throw new Error('No response received from Insighto.ai API');
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create campaign: ${error.message}`);
      }
      throw new Error('Failed to create campaign');
    }
  },
});
