import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetCollaborationOutputSchema } from '../../../output-schemas';

export const getCollaborationAction = createAction({
  auth: boxAuth,
  name: 'box_get_collaboration',
  outputSchema: boxGetCollaborationOutputSchema,
  displayName: 'Get Collaboration',
  description: 'Gets a collaboration on a Box file or folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one collaboration by ID: the item, the user or group, its role, status and expiry. Get the ID from List File Collaborations, List Folder Collaborations or Create Collaboration.',
    idempotent: true,
  },
  props: {
    collaborationId: boxAiProps.collaborationId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/collaborations/${encodeURIComponent(propsValue.collaborationId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
