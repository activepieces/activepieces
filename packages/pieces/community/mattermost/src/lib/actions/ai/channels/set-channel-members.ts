import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostSetChannelMembersOutputSchema } from '../../../output-schemas';

export const setChannelMembersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_channel_members',
  outputSchema: mattermostSetChannelMembersOutputSchema,
  displayName: 'Set Channel Members',
  description: 'Replaces a channel\'s whole member list; everyone not listed is removed.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Replaces the full member list of a public or private channel: listed users are added and EVERYONE NOT LISTED IS REMOVED. To add or remove one person use Add Channel Member or Remove Channel Member instead. Channel Admins, when given, become the only channel admins. Needs the manage_system permission and server 11.7+; direct and group messages are rejected.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    members: Property.Array({
      displayName: 'Members',
      description: 'User IDs that should be in the channel afterwards. Every current member not listed here (or in Channel Admins) is removed.',
      required: true,
    }),
    channelAdmins: Property.Array({
      displayName: 'Channel Admins',
      description: 'User IDs that should be channel admins afterwards; they are also kept as members and every other member is demoted. Leave empty to keep existing admin roles.',
      required: false,
    }),
  },
  async run(context) {
    const { channelId, members, channelAdmins } = context.propsValue;
    const admins = channelAdmins ?? [];
    if (members.length === 0 && admins.length === 0) {
      throw new Error('Members is empty, which would remove everyone from the channel. List the users who should stay.');
    }
    const response = await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/channels/${encodeURIComponent(channelId)}/members`,
      body: { members, ...(admins.length > 0 ? { channel_admins: admins } : {}) },
    });
    const batches = parseNdjson({ response });
    const interrupted = batches.find(
      (batch) => typeof batch === 'object' && batch !== null && 'error' in batch,
    );
    if (interrupted !== undefined) {
      throw new Error(
        `Set Channel Members stopped part-way; membership may be partly changed. Batches applied before it stopped: ${JSON.stringify(batches)}`,
      );
    }
    return { batches, count: batches.length };
  },
});

function parseNdjson({ response }: { response: unknown }): unknown[] {
  if (response === undefined || response === null) {
    return [];
  }
  if (typeof response !== 'string') {
    return [response];
  }
  return response
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line): unknown => JSON.parse(line));
}
