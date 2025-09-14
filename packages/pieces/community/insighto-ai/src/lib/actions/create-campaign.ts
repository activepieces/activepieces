import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

export const createCampaign = createAction({
  auth: insightoAiAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Creates a new outbound calling campaign.',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'The name of the new campaign.',
      required: true,
    }),
    widgetId: Property.Dropdown({
      displayName: 'Widget',
      description: 'Select the widget to use for this campaign.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [] };
        const response = await httpClient.sendRequest<{
          data: { items: { id: string; name: string }[] };
        }>({
          method: HttpMethod.GET,
          url: 'https://api.insighto.ai/v1/widget',
          headers: { Authorization: `Bearer ${auth as string}` },
        });
        return {
          disabled: false,
          options: response.body.data.items.map((item) => ({
            label: item.name,
            value: item.id,
          })),
        };
      },
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'The date and time when the campaign should start.',
      required: true,
    }),
    interval: Property.Number({
      displayName: 'Interval (seconds)',
      description: 'The interval in seconds between campaign actions.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Initial Status',
      description: 'Set the initial status of the campaign.',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'not_started' },
          { label: 'To Be Run', value: 'to_be_run' },
          { label: 'Paused', value: 'paused' },
        ],
      },
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Set to true to enable the campaign upon creation.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { name, widgetId, startTime, interval, status, enabled } =
      context.propsValue;

    const requestBody = {
      name: name,
      widget_id: widgetId,
      start_time: startTime,
      interval: interval,
      type: 'outbound_call', 
      status: status,
      enabled: enabled,
    };

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.insighto.ai/v1/campaign/create',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      body: requestBody,
    });
  },
});
