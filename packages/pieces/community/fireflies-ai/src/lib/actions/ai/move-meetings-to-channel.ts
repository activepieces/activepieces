import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const moveMeetingsToChannelAction = createAction({
  auth: firefliesAiAuth,
  name: 'move_meetings_to_channel',
  classification: 'WRITE',
  displayName: 'Move Meetings to Channel',
  description: 'Moves up to 5 meetings into a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves 1 to 5 Fireflies meetings into one channel, replacing the channel they were in. All or nothing: if one meeting cannot be moved, none are. Get channel IDs from List Channels. Repeating the call leaves the same result.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.moveMeetingsToChannel,
  props: {
    meeting_ids: Property.Array({
      displayName: 'Meeting IDs',
      description: '1 to 5 Fireflies meeting IDs to move.',
      required: true,
    }),
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The destination channel ID, from List Channels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingIds = firefliesInput.textList({ value: propsValue.meeting_ids, label: 'Meeting IDs', max: 5 });
    if (meetingIds.length === 0) {
      throw new Error('Meeting IDs needs at least one meeting ID.');
    }
    const channelId = firefliesInput.requireText({ value: propsValue.channel_id, label: 'Channel ID' });
    const channelData = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.getChannel,
      variables: { channelId },
      operation: `look up channel ${channelId} (use List Channels for valid IDs)`,
    });
    firefliesClient.requireEntity({ data: channelData, key: 'channel', notFound: `Channel ${channelId} was not found. Use List Channels to get a valid channel ID.` });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.updateMeetingChannel,
      variables: { transcriptIds: meetingIds, channelId },
      operation: `move ${meetingIds.length} meeting(s) to channel ${channelId}`,
    });
    const meetings = firefliesClient.recordList(data['updateMeetingChannel']);
    const returnedIds = new Set(meetings.map((meeting) => meeting['id']));
    const missing = meetingIds.filter((id) => !returnedIds.has(id));
    if (missing.length > 0) {
      throw new Error(`Fireflies did not confirm the move for: ${missing.join(', ')}. Check the meetings with Get Meeting.`);
    }
    return { channel_id: channelId, meetings };
  },
});
