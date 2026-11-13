import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const startCommercial = createAction({
  auth: twitchAuth,
  name: 'start_commercial',
  displayName: 'Start Commercial',
  description: 'Run an ad break on your live channel.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a commercial (ad break) on the connected account\'s own live Twitch channel. Requires channel:edit:commercial; the channel must be live (Twitch returns 400 otherwise). length is 1 to 180 seconds (Twitch may shorten it). Returns length (actual seconds), message and retry_after (seconds until the next commercial is allowed). Not idempotent: each call runs an ad break.',
    idempotent: false,
  },
  props: {
    length: Property.Number({
      displayName: 'Length (seconds)',
      description: '1 to 180.',
      required: true,
      defaultValue: 30,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'length', label: 'Length (seconds)', format: 'number' },
      { key: 'message', label: 'Message' },
      { key: 'retry_after', label: 'Retry After (seconds)', format: 'number' },
    ],
  },
  async run({ auth, propsValue }) {
    const length = twitchCommon.assertInteger({ value: propsValue.length, min: 1, max: 180, label: 'Length' });
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.POST,
      path: '/channels/commercial',
      body: { broadcaster_id: user.id, length },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'commercial' });
  },
});
