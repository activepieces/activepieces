import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListGroupCollaborationsOutputSchema } from '../../../output-schemas';

export const listGroupCollaborationsAction = createAction({
  auth: boxAuth,
  name: 'box_list_group_collaborations',
  outputSchema: boxListGroupCollaborationsOutputSchema,
  displayName: 'List Group Collaborations',
  description: 'Lists the files and folders a Box group has access to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the collaborations of a group, showing which files and folders it can access and with what role; needs admin rights or group membership. Page with Offset. Get the group ID from List Groups.',
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
      path: `/groups/${encodeURIComponent(propsValue.groupId)}/collaborations`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
      },
    });
  },
});
