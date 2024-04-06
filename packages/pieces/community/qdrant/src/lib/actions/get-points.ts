import { createAction } from '@activepieces/pieces-framework';
import { seclectPointsProps, convertToFilter, collectionName } from '../common';
import { qdrantAuth } from '../..';
import { QdrantClient } from '@qdrant/js-client-rest';

export const getPoints = createAction({
  auth: qdrantAuth,
  name: 'get_points',
  displayName: 'Get Points',
  description: 'Get the points of a specific collection',
  props: {
    collectionName,
    ...seclectPointsProps,
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAddress,
    });
    const collectionName = propsValue.collectionName as string;

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
      const filtering = propsValue.infosToGetPoint as {
        must: any;
        must_not: any;
      };
      return await client.scroll(collectionName, {
        filter: convertToFilter(filtering),
      });
    }
  },
});
