import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const deleteScheduleSegment = createAction({
  auth: twitchAuth,
  name: 'delete_schedule_segment',
  displayName: 'Delete Schedule Segment',
  description: 'Remove a segment from your streaming schedule.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a segment from the connected account\'s own Twitch schedule by segment_id (from Get Channel Schedule). Requires channel:manage:schedule. Deleting a recurring segment removes the whole weekly series. Cannot be undone. Returns success and segment_id. This action is irreversible: confirm with the user before calling it.',
    idempotent: false,
  },
  props: {
    segment_id: Property.ShortText({
      displayName: 'Segment ID',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'segment_id', label: 'Segment ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const segmentId = twitchCommon.requiredText({ value: propsValue.segment_id, label: 'Segment ID' });
    const user = await twitchCommon.getTokenUser({ auth });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: '/schedule/segment',
      query: { broadcaster_id: user.id, id: segmentId },
    });
    return { success: true, segment_id: segmentId };
  },
});
