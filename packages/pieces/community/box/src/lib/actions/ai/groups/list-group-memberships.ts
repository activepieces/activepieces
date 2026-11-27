import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listGroupMembershipsAction = createAction({
  auth: boxAuth,
  name: 'box_list_group_memberships',
  displayName: 'List Group Memberships',
  description: 'Lists the members of a Box group.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a group\'s memberships: each has a membership ID, the user and their role. Use List User Memberships for one user\'s groups. Get the group ID from List Groups; page with Offset.',
    idempotent: true,
  },
  props: {
    groupId: boxAiProps.groupId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/groups/${encodeURIComponent(propsValue.groupId)}/memberships`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
      },
    });
  },
});
