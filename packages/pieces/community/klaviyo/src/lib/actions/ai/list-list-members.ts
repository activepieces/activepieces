import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, joinFilters, klaviyoApi, pathFor } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listListMembersAi = createAction({
  auth: klaviyoAuth,
  name: 'list_list_members_ai',
  classification: 'SEARCH',
  displayName: 'List List Members',
  description: 'List the profiles in a Klaviyo list, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the profiles that belong to one Klaviyo list, with the time each joined (joined_group_at), optionally only those with an exact email or joined after a date-time. Find the list ID with List Lists or Find List by Name. Pass next_cursor back as cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiProfilePage,
  props: {
    list_id: klaviyoInputs.idProp({
      displayName: 'List ID',
      description: 'The list ID. Get it from List Lists or Find List by Name.',
      required: true,
    }),
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email to match.', required: false }),
    joined_after: Property.ShortText({ displayName: 'Joined After', description: 'ISO 8601 date-time with timezone; only members who joined after it.', required: false }),
    page_size: klaviyoInputs.pageSizeProp({ max: 100, defaultValue: 20 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const groupId = klaviyoInputs.requireText({ value: propsValue.list_id, label: 'List ID' });
    const email = klaviyoInputs.optionalText(propsValue.email);
    const joinedAfter = klaviyoInputs.isoDateTime({ value: propsValue.joined_after, label: 'Joined After' });
    const page = await klaviyoApi.listPage({
      auth,
      path: `${pathFor(['lists', groupId])}/profiles`,
      query: {
        filter: joinFilters([
          email === undefined ? undefined : equalsFilter({ field: 'email', value: email }),
          joinedAfter === undefined ? undefined : `greater-than(joined_group_at,${joinedAfter})`,
        ]),
        'page[size]': klaviyoInputs.pageSize({ value: propsValue.page_size, max: 100, defaultValue: 20 }),
      },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: klaviyoInputs.flatProfile });
  },
});
