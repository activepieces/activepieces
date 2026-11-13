import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getAdSchedule = createAction({
  auth: twitchAuth,
  name: 'get_ad_schedule',
  displayName: 'Get Ad Schedule',
  description: 'Get the ad schedule of your channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the ad schedule of the connected account\'s own Twitch channel. Requires channel:read:ads. Works on any channel, but only Affiliates and Partners have real ad data. Returns next_ad_at, last_ad_at and snooze_refresh_at as ISO 8601 strings, or null when there is none (Twitch sends 0), duration (seconds), preroll_free_time (seconds), snooze_count (snoozes left) and snooze_refresh_at.',
    idempotent: true,
  },
  props: {
  },
  outputSchema: {
    fields: [
      { key: 'next_ad_at', label: 'Next Ad At (empty if none)', format: 'datetime' },
      { key: 'last_ad_at', label: 'Last Ad At (empty if none)', format: 'datetime' },
      { key: 'duration', label: 'Duration (seconds)', format: 'number' },
      { key: 'preroll_free_time', label: 'Pre-roll Free Time (seconds)', format: 'number' },
      { key: 'snooze_count', label: 'Snoozes Left', format: 'number' },
      { key: 'snooze_refresh_at', label: 'Snooze Refresh At (empty if none)', format: 'datetime' },
    ],
  },
  async run({ auth }) {
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/channels/ads',
      query: { broadcaster_id: user.id },
    });
    const schedule = twitchCommon.firstItem({ page: response.body, label: 'ad schedule' });
    return {
      ...schedule,
      next_ad_at: twitchCommon.unixToIso(schedule['next_ad_at']),
      last_ad_at: twitchCommon.unixToIso(schedule['last_ad_at']),
      snooze_refresh_at: twitchCommon.unixToIso(schedule['snooze_refresh_at']),
    };
  },
});
