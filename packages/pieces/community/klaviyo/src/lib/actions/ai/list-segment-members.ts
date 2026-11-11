import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, joinFilters, klaviyoApi, pathFor } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listSegmentMembersAi = createAction({
  auth: klaviyoAuth,
  name: 'list_segment_members_ai',
  classification: 'SEARCH',
  displayName: 'List Segment Members',
  description: 'List the profiles in a Klaviyo segment, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the profiles that belong to one Klaviyo segment, with the time each joined (joined_group_at), optionally only those with an exact email or joined after a date-time. Find the segment ID with List Segments. Pass next_cursor back as cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiProfilePage,
  props: {
    segment_id: klaviyoInputs.idProp({
      displayName: 'Segment ID',
      description: 'The segment ID. Get it from List Segments.',
      required: true,
    }),
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email to match.', required: false }),
    joined_after: Property.ShortText({ displayName: 'Joined After', description: 'ISO 8601 date-time with timezone; only members who joined after it.', required: false }),
    page_size: klaviyoInputs.pageSizeProp({ max: 100, defaultValue: 20 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const groupId = klaviyoInputs.requireText({ value: propsValue.segment_id, label: 'Segment ID' });
    const email = klaviyoInputs.optionalText(propsValue.email);
    const joinedAfter = klaviyoInputs.isoDateTime({ value: propsValue.joined_after, label: 'Joined After' });
    const page = await klaviyoApi.listPage({
      auth,
      path: `${pathFor(['segments', groupId])}/profiles`,
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
