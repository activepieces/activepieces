import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';
import { qdrantClient } from '../common/client';
import { qdrantProps } from '../common/props';
import { qdrantUtils } from '../common/utils';
import { qdrantUpdateResultOutputSchema } from '../output-schemas';

export const deletePoints = createAction({
  auth: qdrantAuth,
  name: 'delete_points',
  outputSchema: qdrantUpdateResultOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Points',
  description: 'Delete points of a specific collection',
  audience: 'human',
  aiMetadata: {
    description:
      'Delete points from a Qdrant collection, selecting them either by an explicit list of ids or by a payload filter (must / must_not conditions). Use to remove specific vectors from a collection. Idempotent: deleting points that are already absent leaves the same end state.',
    idempotent: true,
  },
  props: {
    collectionName: qdrantProps.collectionName({ required: true }),
    getPointsBy: qdrantProps.getPointsBy({ required: true }),
    infosToGetPoint: qdrantProps.infosToGetPoint({ required: true }),
  },
  run: async ({ auth, propsValue }) => {
    const client = qdrantClient.create({ auth });

    const collectionName = propsValue.collectionName;
    if (propsValue.getPointsBy === 'Ids') {
      const ids = JSON.parse(propsValue.infosToGetPoint['ids']);
      return await client.delete(collectionName, {
        points: ids instanceof Array ? ids : [ids],
      });
    }
    const filter = qdrantUtils.convertToFilter({
      must: propsValue.infosToGetPoint['must'],
      must_not: propsValue.infosToGetPoint['must_not'],
    });
    return await client.delete(collectionName, {
      filter,
      wait: true,
    });
  },
});
