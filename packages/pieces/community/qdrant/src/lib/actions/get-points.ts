import { createAction } from '@activepieces/pieces-framework';
import { seclectPointsProps, convertToFilter, collectionName } from '../common';
import { qdrantAuth } from '../..';
import { QdrantClient } from '@qdrant/js-client-rest';

export const getPoints = createAction({
  auth: qdrantAuth,
  name: 'get_points',
  displayName: 'Get Points',
  description: 'Get the points of a specific collection',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch points from a Qdrant collection, selecting them either by an explicit list of ids or by a payload filter (must / must_not conditions). Use to look up known points or scroll through points matching metadata, as opposed to vector-similarity search. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    collectionName,
    ...seclectPointsProps,
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.props.key,
      url: auth.props.serverAddress,
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
