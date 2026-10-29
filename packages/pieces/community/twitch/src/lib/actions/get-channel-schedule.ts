import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getChannelSchedule = createAction({
  auth: twitchAuth,
  name: 'get_channel_schedule',
  displayName: 'Get Channel Schedule',
  description: 'Get the upcoming broadcast schedule of a channel.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the streaming schedule of a Twitch channel (default: the connected account). Optionally start from start_time (ISO 8601). Returns broadcaster_id, broadcaster_login, broadcaster_name, vacation ({start_time,end_time} or null), segments[] (id, start_time, end_time, title, canceled_until, category {id,name}, is_recurring), count and next_cursor. A channel without a schedule returns an empty segments list instead of an error.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    start_time: Property.DateTime({
      displayName: 'Start From',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 250 }),
  },
  outputSchema: {
    fields: [
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'broadcaster_login', label: 'Broadcaster Login' },
      { key: 'broadcaster_name', label: 'Broadcaster Name' },
      {
        key: 'vacation',
        label: 'Vacation',
        children: [
          { key: 'start_time', label: 'Start Time', format: 'datetime' },
          { key: 'end_time', label: 'End Time', format: 'datetime' },
        ],
      },
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
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 250 });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const startTime = propsValue.start_time ? new Date(propsValue.start_time).toISOString() : undefined;
    const segments: Record<string, unknown>[] = [];
    let schedule: ScheduleData | null = null;
    let cursor: string | undefined;
    while (segments.length < limit) {
      const response = await twitchCommon.requestOrNotFound<SchedulePage>({
        auth,
        method: HttpMethod.GET,
        path: '/schedule',
        query: {
          broadcaster_id: broadcasterId,
          start_time: startTime,
          first: String(Math.min(25, limit - segments.length)),
          after: cursor,
        },
      });
      if (!response) {
        break;
      }
      schedule = response.body.data;
      const page = response.body.data.segments ?? [];
      segments.push(...page.slice(0, limit - segments.length));
      cursor = response.body.pagination?.cursor;
      if (!cursor || page.length === 0) {
        cursor = undefined;
        break;
      }
    }
    return {
      broadcaster_id: schedule?.broadcaster_id ?? broadcasterId,
      broadcaster_login: schedule?.broadcaster_login ?? null,
      broadcaster_name: schedule?.broadcaster_name ?? null,
      vacation: schedule?.vacation ?? null,
      segments,
      count: segments.length,
      next_cursor: cursor ?? null,
    };
  },
});

type ScheduleData = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  vacation: { start_time: string; end_time: string } | null;
  segments: Record<string, unknown>[] | null;
};

type SchedulePage = {
  data: ScheduleData;
  pagination?: { cursor?: string };
};
