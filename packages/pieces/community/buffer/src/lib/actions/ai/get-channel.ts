import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { getChannelOutputSchema } from '../../common/output-schemas';

export const getChannel = createAction({
  auth: bufferAuth,
  name: 'get_channel',
  classification: 'READ',
  displayName: 'Get a Channel',
  description: 'Get one Buffer channel with its posting schedule and service settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Buffer channel by Channel ID, adding what List Channels leaves out: the weekly posting schedule (queue slot times), posting goal, link shortening, allowed actions and service settings such as Pinterest boards (needed as metadata.pinterest.boardServiceId when pinning) or the Mastodon server. Read-only.',
    idempotent: true,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The channel ID from List Channels.',
      required: true,
    }),
  },
  outputSchema: getChannelOutputSchema,
  async run(context) {
    const id = bufferAiProps.requiredId({ value: context.propsValue.channelId, label: 'Channel ID' });
    const data = await bufferClient.graphql<{ channel: Record<string, unknown> }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.CHANNEL,
      variables: { id },
      operation: `load channel ${id}`,
    });
    return data.channel;
  },
});
