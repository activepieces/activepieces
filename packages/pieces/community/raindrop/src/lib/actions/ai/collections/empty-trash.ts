import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropEmptyTrashAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_empty_trash',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Empty Trash',
  description: 'Permanently deletes every bookmark in Trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes every bookmark in the Trash collection (-99); they cannot be recovered. Get Collection Counts shows how many are in Trash first.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropEmptyTrashResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: '/collection/-99',
    });
  },
});

type RaindropEmptyTrashResponse = {
  result: boolean;
};
