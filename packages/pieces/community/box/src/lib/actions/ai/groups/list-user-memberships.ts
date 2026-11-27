import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listUserMembershipsAction = createAction({
  auth: boxAuth,
  name: 'box_list_user_memberships',
  displayName: 'List User Memberships',
  description: 'Lists the groups a Box user belongs to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a user\'s group memberships: each has a membership ID, the group and the user\'s role. Use List Group Memberships for a group\'s members. Get the user ID from List Users; page with Offset.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(propsValue.userId)}/memberships`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
      },
    });
  },
});
