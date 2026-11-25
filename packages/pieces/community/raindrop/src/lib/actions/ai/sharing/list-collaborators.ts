import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropListCollaboratorsOutputSchema } from '../../../output-schemas';

export const raindropListCollaboratorsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_collaborators',
  outputSchema: raindropListCollaboratorsOutputSchema,
  displayName: 'List Collaborators',
  description: 'Lists the people a collection is shared with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the collaborators of a shared collection (ID from List Collections) with their user ID, name, email and role. Use it to get the User ID that Update Collaborator and Remove Collaborator take.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description: 'ID of the shared collection, from List Collections.',
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropListCollaboratorsResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}/sharing`,
    });
  },
});

type RaindropListCollaboratorsResponse = {
  result: boolean;
  items: Record<string, unknown>[];
};
