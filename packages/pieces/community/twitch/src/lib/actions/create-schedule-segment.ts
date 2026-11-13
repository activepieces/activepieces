import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const createScheduleSegment = createAction({
  auth: twitchAuth,
  name: 'create_schedule_segment',
  displayName: 'Create Schedule Segment',
  description: 'Add a broadcast to your channel\'s streaming schedule.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a scheduled broadcast to the connected account\'s own Twitch schedule. Requires channel:manage:schedule. start_time (ISO 8601) and timezone (IANA, for example America/New_York) are required; duration 30 to 1380 minutes (default 240); title max 140 characters; category_id from Search Categories. is_recurring "yes" repeats weekly; non-recurring segments need Affiliate or Partner. Returns the schedule with segments[] containing the new segment id. Not idempotent: each call adds a segment.',
    idempotent: false,
  },
  props: {
    start_time: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'IANA time zone, for example America/New_York.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      description: '30 to 1380.',
      required: false,
      defaultValue: 240,
    }),
    is_recurring: Property.StaticDropdown({
      displayName: 'Repeat Weekly',
      description: 'Non-recurring segments require Affiliate or Partner.',
      required: true,
      defaultValue: 'yes',
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Up to 140 characters.',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Use Search Categories to find the ID.',
      required: false,
    }),
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
    const timezone = twitchCommon.requiredText({ value: propsValue.timezone, label: 'Time Zone' });
    const duration = twitchCommon.assertInteger({ value: propsValue.duration, min: 30, max: 1380, label: 'Duration' });
    const title = twitchCommon.optionalText(propsValue.title);
    if (title !== undefined) {
      twitchCommon.assertTextLength({ value: title, max: 140, label: 'Title' });
    }
    const isRecurring = twitchCommon.triState(propsValue.is_recurring);
    if (isRecurring === undefined) {
      throw new Error('Choose whether the segment repeats weekly.');
    }
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.request<ScheduleResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/schedule/segment',
      query: { broadcaster_id: user.id },
      body: twitchCommon.compact({
        start_time: new Date(propsValue.start_time).toISOString(),
        timezone,
        duration: duration === undefined ? undefined : String(duration),
        is_recurring: isRecurring,
        category_id: twitchCommon.optionalText(propsValue.category_id),
        title,
      }),
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
