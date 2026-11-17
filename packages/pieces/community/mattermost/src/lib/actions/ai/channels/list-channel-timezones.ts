import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListChannelTimezonesOutputSchema } from '../../../output-schemas';

export const listChannelTimezonesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_channel_timezones',
  outputSchema: mattermostListChannelTimezonesOutputSchema,
  displayName: 'List Channel Timezones',
  description: 'Lists the timezones of a channel\'s members.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the distinct timezone names (e.g. "Europe/Berlin") used by the members of a channel, useful for picking a meeting or reminder time.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    const timezones = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}/timezones`,
    });
    return { timezones, count: timezones.length };
  },
});
