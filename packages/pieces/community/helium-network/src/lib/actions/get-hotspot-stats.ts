import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getHotspotStats = createAction({
  name: 'get_hotspot_stats',
  displayName: 'Get Hotspot Stats',
  description: 'Get information and reward stats for a Helium hotspot by its address.',
  props: {
    hotspot_address: Property.ShortText({
      displayName: 'Hotspot Address',
      description: 'The B58 address of the Helium hotspot to look up.',
      required: true,
    }),
  },
  async run(context) {
    const { hotspot_address } = context.propsValue;

    const [hotspotResp, rewardsResp] = await Promise.all([
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.helium.io/v1/hotspots/${hotspot_address}`,
      }),
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.helium.io/v1/hotspots/${hotspot_address}/rewards/sum?min_time=-30%20day`,
      }),
    ]);

    const hotspot = hotspotResp.body?.data;
    const rewards = rewardsResp.body?.data;

    if (!hotspot) {
      throw new Error(`No hotspot found for address: ${hotspot_address}`);
    }

    return {
      address: hotspot.address,
      name: hotspot.name,
      owner: hotspot.owner,
      location: hotspot.geocode
        ? {
            city: hotspot.geocode.long_city,
            state: hotspot.geocode.long_state,
            country: hotspot.geocode.short_country,
          }
        : null,
      lat: hotspot.lat,
      lng: hotspot.lng,
      status: hotspot.status?.online ?? 'unknown',
      gain: hotspot.gain,
      elevation: hotspot.elevation,
      block_added: hotspot.block_added,
      last_poc_challenge: hotspot.last_poc_challenge,
      rewards_30d_hnt: rewards ? rewards.total / 1e8 : null,
      reward_scale: hotspot.reward_scale,
    };
  },
});
