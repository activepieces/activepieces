import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';
import { qdrantClient } from '../common/client';
import { qdrantProps } from '../common/props';
import { qdrantUtils } from '../common/utils';

export const getPoints = createAction({
  auth: qdrantAuth,
  name: 'get_points',
  classification: 'SEARCH',
  displayName: 'Get Points',
  description: 'Get the points of a specific collection',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetch points from a Qdrant collection, selecting them either by an explicit list of ids or by a payload filter (must / must_not conditions). Use to look up known points or scroll through points matching metadata, as opposed to vector-similarity search. Read-only and idempotent.',
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
      let ids = JSON.parse(propsValue.infosToGetPoint['ids']);
      try {
        ids = JSON.parse(ids);
      } catch {
        null;
      }
      return await client.retrieve(collectionName, {
        ids: ids instanceof Array ? ids : [ids],
      });
    } else {
      return await client.scroll(collectionName, {
        filter: qdrantUtils.convertToFilter({
          must: propsValue.infosToGetPoint['must'],
          must_not: propsValue.infosToGetPoint['must_not'],
        }),
      });
    }
  },
});
