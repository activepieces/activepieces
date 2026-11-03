import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropUpdateCollaboratorAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_collaborator',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Update Collaborator',
  description: "Changes a collaborator's access level on a shared collection.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Sets a collaborator's role on a shared collection to member (can edit and invite) or viewer (read-only). Collection ID comes from List Collections, User ID from List Collaborators. Use Remove Collaborator to take access away instead.",
    idempotent: true,
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
    role: raindropAiProps.collaboratorRole({
      required: true,
      description:
        'New access level: "member" can edit and invite more people, "viewer" is read-only.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.role !== 'member' && propsValue.role !== 'viewer') {
      throw new Error(`Role must be "member" or "viewer"; got "${propsValue.role}".`);
    }
    return await raindropClient.request<RaindropUpdateCollaboratorResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/collection/${encodeURIComponent(
        propsValue.collectionId,
      )}/sharing/${encodeURIComponent(propsValue.userId)}`,
      body: { role: propsValue.role },
    });
  },
});

type RaindropUpdateCollaboratorResponse = {
  result: boolean;
};
