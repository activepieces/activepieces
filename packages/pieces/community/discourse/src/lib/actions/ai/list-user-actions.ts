import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listUserActionsAction = createAction({
  auth: discourseAuth,
  name: 'list_user_actions',
  classification: 'SEARCH',
  displayName: 'List User Activity',
  description: 'Lists the recent activity of a Discourse user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the activity feed of a Discourse user by username (topics created, replies, likes given or received, mentions), newest first, 30 per call; pass next_offset as Offset for more. Read-only.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
    filter: Property.StaticMultiSelectDropdown({
      displayName: 'Activity Types',
      description: 'Leave empty for all types.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Likes given', value: '1' },
          { label: 'Likes received', value: '2' },
          { label: 'Topics created', value: '4' },
          { label: 'Replies', value: '5' },
          { label: 'Responses to me', value: '6' },
          { label: 'Mentions', value: '7' },
          { label: 'Quotes', value: '9' },
          { label: 'Edits', value: '11' },
        ],
      },
    }),
    offset: Property.Number({ displayName: 'Offset', required: false }),
  },
  outputSchema: discourseSchemas.userActions,
  async run({ auth, propsValue }) {
    const username = discourseInput.text({ value: propsValue.username, label: 'Username' });
    const offset = discourseInput.boundedNumber({ value: propsValue.offset, label: 'Offset', min: 0, max: 1000000, fallback: 0 });
    const filter = (propsValue.filter ?? []).filter((value) => /^\d+$/.test(value)).join(',');
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.GET,
        path: '/user_actions.json',
        query: { username, offset, filter },
      }),
    );
    const items = discourseMap.list(body['user_actions']).map((raw) => discourseMap.userAction({ raw }));
    const hasMore = items.length >= PAGE_SIZE;
    return { items, count: items.length, offset, next_offset: hasMore ? offset + items.length : null, has_more: hasMore };
  },
});

const PAGE_SIZE = 30;
