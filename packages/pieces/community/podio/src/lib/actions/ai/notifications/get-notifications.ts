import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetNotificationsOutputSchema } from '../../../output-schemas';

export const getNotificationsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_notifications',
  outputSchema: podioGetNotificationsOutputSchema,
  displayName: 'Get Notifications',
  description: 'Lists your notifications, grouped by the object they are about.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the connected user\'s Podio notifications, grouped by their context (the item, task, status or conversation they are about), filtered by type, date, viewed or starred state. Limit is capped at 100. Use it to find notification ids and object refs for the other notification actions.',
    idempotent: true,
  },
  props: {
    viewed: podioAiProps.bool({ required: false, displayName: 'Viewed', description: '"false" returns only unviewed notifications (the inbox), "true" only viewed ones. Leave empty for both.' }),
    starred: podioAiProps.bool({ required: false, displayName: 'Starred', description: '"true" returns only starred notifications, "false" only unstarred ones. Leave empty for both.' }),
    direction: podioAiProps.choice({ required: false, displayName: 'Direction', description: '"incoming" for notifications sent to you, "outgoing" for ones your actions caused. Defaults to "incoming".', values: directionValues() }),
    contextType: podioAiProps.text({ required: false, displayName: 'Context Type', description: 'Only notifications about this type of object, such as "conversation", "item" or "task".' }),
    type: podioAiProps.text({ required: false, displayName: 'Notification Type', description: 'Only notifications of this type, such as "comment", "creation", "update" or "message".' }),
    userId: podioAiProps.id({ required: false, displayName: 'Other User ID', description: 'Only notifications involving this user, from List Space Members or Get Organization Members.' }),
    createdFrom: podioAiProps.text({ required: false, displayName: 'Created From', description: 'Earliest creation time, as "YYYY-MM-DD HH:MM:SS" in UTC.' }),
    createdTo: podioAiProps.text({ required: false, displayName: 'Created To', description: 'Latest creation time, as "YYYY-MM-DD HH:MM:SS" in UTC.' }),
    viewedFrom: podioAiProps.text({ required: false, displayName: 'Viewed From', description: 'With Viewed set to "false", also returns notifications viewed after this time, as "YYYY-MM-DD HH:MM:SS" in UTC, so paging stays stable.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of notification groups to return, up to 100. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.direction && !directionValues().includes(propsValue.direction)) {
      throw new Error(`Direction must be one of: ${directionValues().join(', ')}.`);
    }
    const notifications = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/notification/',
      query: podioUtils.query({
        values: {
          viewed: podioUtils.toBool({ value: propsValue.viewed }),
          starred: podioUtils.toBool({ value: propsValue.starred }),
          direction: propsValue.direction,
          context_type: propsValue.contextType,
          type: propsValue.type,
          user_id: propsValue.userId,
          created_from: propsValue.createdFrom,
          created_to: propsValue.createdTo,
          viewed_from: propsValue.viewedFrom,
          limit: typeof propsValue.limit === 'number' ? Math.min(propsValue.limit, MAX_LIMIT) : undefined,
          offset: propsValue.offset,
        },
      }),
    });
    return { notifications, count: notifications.length };
  },
});

function directionValues(): string[] {
  return ['incoming', 'outgoing'];
}

const MAX_LIMIT = 100;
