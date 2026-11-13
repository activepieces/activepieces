import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropRemoveCollaboratorAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_remove_collaborator',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Remove Collaborator',
  description: 'Removes a person from a shared collection.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one collaborator from a shared collection; they lose access until invited again with Share Collection. Collection ID comes from List Collections, User ID from List Collaborators. To remove everyone at once use Unshare Collection.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description: 'ID of the shared collection, from List Collections.',
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Collaborator user ID, from List Collaborators.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropRemoveCollaboratorResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collection/${encodeURIComponent(
        propsValue.collectionId,
      )}/sharing/${encodeURIComponent(propsValue.userId)}`,
    });
  },
});

type RaindropRemoveCollaboratorResponse = {
  result: boolean;
};
