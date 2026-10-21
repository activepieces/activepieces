import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const listGroupMembersAction = createAction({
  auth: discourseAuth,
  name: 'list_group_members',
  classification: 'SEARCH',
  displayName: 'List Group Members',
  description: 'Lists the members of a Discourse group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List members of a Discourse group by group name, with Offset and Limit (max 1000) for paging; owners are marked is_owner. Read-only.',
    idempotent: true,
  },
  props: {
    group_name: Property.ShortText({ displayName: 'Group Name', required: true }),
    offset: Property.Number({ displayName: 'Offset', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 1000. Default 50.', required: false }),
  },
  outputSchema: discourseSchemas.groupMembers,
  async run({ auth, propsValue }) {
    const name = discourseInput.name({ value: propsValue.group_name, label: 'Group Name' });
    const offset = discourseInput.boundedNumber({ value: propsValue.offset, label: 'Offset', min: 0, max: 10000000, fallback: 0 });
    const limit = discourseInput.boundedNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 1000, fallback: 50 });
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.GET,
        path: `/groups/${name}/members.json`,
        query: { offset, limit },
      }),
    );
    const base = discourseOps.baseUrl(auth.props);
    const owners = discourseMap.list(body['owners']);
    const ownerIds = new Set(owners.map((owner) => discourseMap.num(discourseMap.rec(owner)['id'])));
    const members = discourseMap.list(body['members']);
    const items = members.map((raw) =>
      discourseMap.groupMember({ raw, baseUrl: base, owner: ownerIds.has(discourseMap.num(discourseMap.rec(raw)['id'])) }),
    );
    const total = discourseMap.num(discourseMap.rec(body['meta'])['total']);
    const nextOffset = offset + members.length;
    const hasMore = total !== null ? nextOffset < total : members.length >= limit;
    return { items, count: items.length, total, offset, next_offset: hasMore ? nextOffset : null, has_more: hasMore };
  },
});
