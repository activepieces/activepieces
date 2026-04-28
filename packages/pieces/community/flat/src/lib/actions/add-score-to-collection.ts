import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const addScoreToCollectionAction = createAction({
  auth: flatAuth,
  name: 'add_score_to_collection',
  displayName: 'Add a score to the collection',
  description: 'This operation will add a score to a collection. The default behavior will make the score available across multiple collections. You must have the capability `canAddScores` on the provided `collection` to perform the action. ',
  props: {
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.put({
      auth, endpoint: '/collections/{collection}/scores/{score}',
      body: {

      },
    });
    return response.body;
  },
});
