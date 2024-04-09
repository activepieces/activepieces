import { createAction } from '@activepieces/pieces-framework';
import { collectionName, convertToFilter, seclectPointsProps } from '../common';
import { qdrantAuth } from '../..';
import { QdrantClient } from '@qdrant/js-client-rest';

export const deletePoints = createAction({
  auth: qdrantAuth,
  name: 'delete_points',
  displayName: 'Delete Points',
  description: 'Delete points of a specific collection',
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
      const ids = JSON.parse(propsValue.infosToGetPoint['ids']);
      return await client.delete(collectionName, {
        points: ids instanceof Array ? ids : [ids],
      });
    }
    const filter = convertToFilter(
      propsValue.infosToGetPoint as { must: any; must_not: any }
    );
    // console.log(JSON.stringify(filter))
    return await client.delete(collectionName, {
      filter,
      wait: true,
    });
  },
});
