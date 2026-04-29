import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const deleteScoreFromCollectionAction = createAction({
  auth: flatAuth,
  name: 'delete_score_from_collection',
  displayName: 'Delete a score from the collection',
  description: 'This method will delete a score from the collection. Unlike [`DELETE /scores/{score}`](#operation/deleteScore), this score will not remove the score from your account, but only from the collection. This can be used to *move* a score from one collection to another, or simply remove a score from one collection when this one is contained in multiple collections. ',
  props: {
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.delete({
      auth, endpoint: '/collections/{collection}/scores/{score}',
    });
    return response.body;
  },
});
