import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const updateScheduleSegment = createAction({
  auth: twitchAuth,
  name: 'update_schedule_segment',
  displayName: 'Update Schedule Segment',
  description: 'Change or cancel a segment of your streaming schedule.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Update a segment of the connected account\'s own Twitch schedule by segment_id (from Get Channel Schedule). Requires channel:manage:schedule. Only the fields you provide change: start_time (+ timezone; changing the time needs Affiliate or Partner), duration 30-1380 minutes, title (max 140), category_id, is_canceled "yes"/"no". Editing a recurring segment changes the whole series. Returns the schedule with segments[]. Repeating the same update changes nothing.',
    idempotent: true,
  },
  props: {
    segment_id: Property.ShortText({
      displayName: 'Segment ID',
      required: true,
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'IANA time zone, for example America/New_York.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      description: '30 to 1380.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Up to 140 characters.',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      required: false,
    }),
    is_canceled: twitchCommon.props.yesNo({ displayName: 'Canceled', description: '"yes" cancels this segment, "no" restores it.' }),
  },
  outputSchema: {
    fields: [
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'broadcaster_login', label: 'Broadcaster Login' },
      { key: 'broadcaster_name', label: 'Broadcaster Name' },
      {
        key: 'segments',
        label: 'Segments', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Segment ID' },
          { key: 'start_time', label: 'Start Time', format: 'datetime' },
          { key: 'end_time', label: 'End Time', format: 'datetime' },
          { key: 'title', label: 'Title' },
          { key: 'canceled_until', label: 'Canceled Until', format: 'datetime' },
          {
        key: 'category',
        label: 'Category',
        children: [
          { key: 'id', label: 'Category ID' },
          { key: 'name', label: 'Category Name' },
        ],
      },
          { key: 'is_recurring', label: 'Is Recurring', format: 'boolean' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const segmentId = twitchCommon.requiredText({ value: propsValue.segment_id, label: 'Segment ID' });
    const duration = twitchCommon.assertInteger({ value: propsValue.duration, min: 30, max: 1380, label: 'Duration' });
    const title = twitchCommon.optionalText(propsValue.title);
    if (title !== undefined) {
      twitchCommon.assertTextLength({ value: title, max: 140, label: 'Title' });
    }
    const body = twitchCommon.compact({
      start_time: propsValue.start_time ? new Date(propsValue.start_time).toISOString() : undefined,
      timezone: twitchCommon.optionalText(propsValue.timezone),
      duration: duration === undefined ? undefined : String(duration),
      title,
      category_id: twitchCommon.optionalText(propsValue.category_id),
      is_canceled: twitchCommon.triState(propsValue.is_canceled),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.request<ScheduleResponse>({
      auth,
      method: HttpMethod.PATCH,
      path: '/schedule/segment',
      query: { broadcaster_id: user.id, id: segmentId },
      body,
    });
    return {
      broadcaster_id: response.body.data.broadcaster_id,
      broadcaster_login: response.body.data.broadcaster_login,
      broadcaster_name: response.body.data.broadcaster_name,
      segments: response.body.data.segments ?? [],
    };
  },
});

type ScheduleResponse = {
  data: {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    segments: Record<string, unknown>[] | null;
  };
};
