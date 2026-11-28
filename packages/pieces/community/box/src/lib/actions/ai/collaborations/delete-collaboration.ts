import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteCollaborationOutputSchema } from '../../../output-schemas';

export const deleteCollaborationAction = createAction({
  auth: boxAuth,
  name: 'box_delete_collaboration',
  outputSchema: boxDeleteCollaborationOutputSchema,
  displayName: 'Delete Collaboration',
  description: 'Removes a user\'s or group\'s access to a Box file or folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a collaboration, removing that user\'s or group\'s access to the item; re-invite with Create Collaboration. Get the ID from List File Collaborations or List Folder Collaborations.',
    idempotent: false,
  },
  props: {
    collaborationId: boxAiProps.collaborationId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collaborations/${encodeURIComponent(propsValue.collaborationId)}`,
    });
    return { deleted: true, collaborationId: propsValue.collaborationId };
  },
});
