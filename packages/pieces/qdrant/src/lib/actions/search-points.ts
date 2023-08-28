import { createAction, Property } from '@activepieces/pieces-framework';
import { collectionName, convertToFilter, decodeEmbeddings, filteringProps } from '../common';
import { qdrantAuth } from '../..';
import { QdrantClient } from '@qdrant/js-client-rest';

export const searchPoints = createAction({
  auth: qdrantAuth,
  name: 'search_points',
  displayName: 'Search Points',
  description: 'Search for points closest to your given vector (= embedding)',
  props: {
    collectionName,
    vector: Property.ShortText({
      displayName: 'Embedding',
      required: true,
      description: 'The vector (= embedding) you want to search for.',
    }),
    ...filteringProps,
    negativeVector: Property.ShortText({
      displayName: 'Negative Vector',
      required: false,
      description: 'The vector (= embedding) you want to be the farthest.',
    }),
    limitResult: Property.Number({
      displayName: 'Limit Result',
      required: false,
      description: 'The max number of results you want to get.',
      defaultValue: 20,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAdress,
    });
    const { must, must_not } = propsValue;

    const filter = convertToFilter({
      must,
      must_not,
    });

    let vector = Array.from(decodeEmbeddings(propsValue.vector)[0])
    const negativeVector = propsValue.negativeVector ? Array.from(decodeEmbeddings(propsValue.negativeVector)[0]) : undefined 

    if (
      !(vector instanceof Array) ||
      (negativeVector != undefined && !(negativeVector instanceof Array))
    )
      throw new Error('Vectors should be arrays of numbers');

    const limit = propsValue.limitResult ?? 20;

    if (negativeVector) {
      // math func on: https://qdrant.tech/documentation/concepts/search/?selector=aHRtbCA%2BIGJvZHkgPiBkaXY6bnRoLW9mLXR5cGUoMSkgPiBzZWN0aW9uID4gZGl2ID4gZGl2ID4gZGl2ID4gYXJ0aWNsZSA%2BIGgyOm50aC1vZi10eXBlKDUp
      vector = vector.map((vec, i) => vec*2 + negativeVector[i]);
    }
    const collectionName = propsValue.collectionName as string
    return await client.search(collectionName, {
      vector,
      filter,
      limit,
      with_payload: true,
    });
  },
});
