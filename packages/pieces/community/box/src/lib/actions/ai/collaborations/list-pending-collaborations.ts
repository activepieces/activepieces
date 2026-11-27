import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listPendingCollaborationsAction = createAction({
  auth: boxAuth,
  name: 'box_list_pending_collaborations',
  displayName: 'List Pending Collaborations',
  description: 'Lists the collaboration invites waiting for the current user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the collaboration invites the connected user has not yet accepted or rejected, with their IDs. Answer one with Update Collaboration (Status). Page with Offset.',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/collaborations',
      query: {
        status: 'pending',
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
