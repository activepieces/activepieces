import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getPolls = createAction({
  auth: twitchAuth,
  name: 'get_polls',
  displayName: 'Get Polls',
  description: 'List polls of your channel, newest first, or get polls by ID.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List polls of the connected account\'s own Twitch channel (most recent first, Twitch keeps 90 days) or get up to 20 by ID. Requires channel:read:polls. Works on any channel; channels that are not Affiliate or Partner simply have no polls. Returns polls[] (id, title, choices[] with id/title/votes/channel_points_votes, channel_points_voting_enabled, channel_points_per_vote, status ACTIVE/COMPLETED/TERMINATED/ARCHIVED/MODERATED/INVALID, duration, started_at, ended_at), count and next_cursor.',
    idempotent: true,
  },
  props: {
    poll_ids: Property.Array({
      displayName: 'Poll IDs',
      description: 'Up to 20 poll IDs.',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 100 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'polls',
        label: 'Polls', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Poll ID' },
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Broadcaster Login' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
          { key: 'title', label: 'Title' },
          {
        key: 'choices',
        label: 'Choices', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Choice ID' },
          { key: 'title', label: 'Title' },
          { key: 'votes', label: 'Votes', format: 'number' },
          { key: 'channel_points_votes', label: 'Channel Points Votes', format: 'number' },
          { key: 'bits_votes', label: 'Bits Votes', format: 'number' },
        ],
      },
          { key: 'channel_points_voting_enabled', label: 'Channel Points Voting', format: 'boolean' },
          { key: 'channel_points_per_vote', label: 'Channel Points per Vote', format: 'number' },
          { key: 'status', label: 'Status' },
          { key: 'duration', label: 'Duration (seconds)', format: 'number' },
          { key: 'started_at', label: 'Started At', format: 'datetime' },
          { key: 'ended_at', label: 'Ended At', format: 'datetime' },
        ],
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const pollIds = twitchCommon.idList({ values: propsValue.poll_ids, max: 20, label: 'Poll IDs' });
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 100 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/polls',
      query: { broadcaster_id: user.id, id: pollIds.length > 0 ? pollIds : undefined },
      limit,
      pageSize: 20,
    });
    return { polls: items, count: items.length, next_cursor: nextCursor };
  },
});
