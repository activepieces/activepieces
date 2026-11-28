import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetGroupOutputSchema } from '../../../output-schemas';

export const getGroupAction = createAction({
  auth: boxAuth,
  name: 'box_get_group',
  outputSchema: boxGetGroupOutputSchema,
  displayName: 'Get Group',
  description: 'Gets a Box group by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one group: name, description, type and who can invite it or see its members. Get the ID from List Groups or Create Group; list its members with List Group Memberships.',
    idempotent: true,
  },
  props: {
    groupId: boxAiProps.groupId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/groups/${encodeURIComponent(propsValue.groupId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
