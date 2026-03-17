import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getRewardSummary = createAction({
  name: 'get_reward_summary',
  displayName: 'Get Reward Summary',
  description: 'Get HNT reward summaries for a hotspot or account over a specified time window.',
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The hotspot or account B58 address to query rewards for.',
      required: true,
    }),
    address_type: Property.StaticDropdown({
      displayName: 'Address Type',
      description: 'Whether the address is a hotspot or an account.',
      required: true,
      options: {
        options: [
          { label: 'Hotspot', value: 'hotspots' },
          { label: 'Account', value: 'accounts' },
        ],
      },
      defaultValue: 'hotspots',
    }),
    time_window: Property.StaticDropdown({
      displayName: 'Time Window',
      description: 'The time period to summarize rewards over.',
      required: true,
      options: {
        options: [
          { label: 'Last 24 Hours', value: '-1 day' },
          { label: 'Last 7 Days', value: '-7 day' },
          { label: 'Last 30 Days', value: '-30 day' },
        ],
      },
      defaultValue: '-30 day',
    }),
  },
  async run(context) {
    const { address, address_type, time_window } = context.propsValue;

    const minTime = encodeURIComponent(time_window as string);
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.helium.io/v1/${address_type}/${address}/rewards/sum?min_time=${minTime}`,
    });

    const data = response.body?.data;
    if (!data) {
      throw new Error(`No reward data found for address: ${address}`);
    }

    return {
      address,
      address_type,
      time_window,
      total_hnt: data.total / 1e8,
      total_bones: data.total,
      min: data.min / 1e8,
      max: data.max / 1e8,
      median: data.median / 1e8,
      avg: data.avg / 1e8,
      stddev: data.stddev / 1e8,
      sum: data.sum / 1e8,
    };
  },
});
