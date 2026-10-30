import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listGroupsAction = createAction({
  auth: discourseAuth,
  name: 'list_groups',
  classification: 'SEARCH',
  displayName: 'List Groups',
  description: 'Lists Discourse groups, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the Discourse groups the API user can see with their numeric IDs, names and member counts, one page at a time starting at page 0, optionally filtered by name. Use it to find the Group ID or name other group actions need. Read-only.',
    idempotent: true,
  },
  props: {
    filter: Property.ShortText({ displayName: 'Name Filter', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 0.', required: false }),
  },
  outputSchema: discourseSchemas.groupList,
  async run({ auth, propsValue }) {
    const page = discourseInput.boundedNumber({ value: propsValue.page, label: 'Page', min: 0, max: 10000, fallback: 0 });
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.GET,
        path: '/groups.json',
        query: { page, filter: discourseInput.optionalText(propsValue.filter) },
      }),
    );
    const items = discourseMap.list(body['groups']).map((raw) => discourseMap.group({ raw }));
    const total = discourseMap.num(body['total_rows_groups']);
    const hasMore = items.length > 0 && typeof body['load_more_groups'] === 'string' && (total === null || total > 0);
    return { items, count: items.length, total, page, next_page: hasMore ? page + 1 : null, has_more: hasMore };
  },
});
