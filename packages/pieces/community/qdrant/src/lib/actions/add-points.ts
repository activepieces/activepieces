import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { collectionName, decodeEmbeddings } from '../common';

export const addPointsToCollection = createAction({
  auth: qdrantAuth,
  requireAuth: true,
  name: 'add_points_to_collection',
  displayName: 'Add points to collection',
  description:
    'Insert a point (= embedding or vector + other infos) to a specific collection, if the collection does not exist it will be created',
  props: {
    collectionName,
    embeddings: Property.File({
      displayName: 'Embeddings',
      description: 'Embeddings (= vectors) for the points',
      required: true,
    }),
    embeddingsIds: Property.ShortText({
      displayName: 'Embeddings Ids',
      description: 'The ids of the embeddings for the points',
      defaultValue: 'Auto',
      required: true,
    }),
    distance: Property.StaticDropdown({
      displayName: 'Calculation Method of distance',
      description:
        "The calculation method helps to rank vectors when you want to find the closest points, the method to use depends on the model who's created the embeddings, see the documentation of your model",
      defaultValue: 'Cosine',
      options: {
        options: [
          { label: 'Cosine', value: 'Cosine' },
          { label: 'Euclidean', value: 'Euclid' },
          { label: 'Dot', value: 'Dot' },
        ],
      },
      required: true,
    }),
    content: Property.File({
      displayName: 'Content Chunks',
      description: 'The content chunks of the doc to add to payload',
      required: false,
    }),
    payload: Property.Json({
      displayName: 'Additional Payload',
      description: 'The additional information for the points',
      required: false,
    }),
    storage: Property.StaticDropdown({
      displayName: 'Storage',
      description: 'Define where points will be stored',
      options: {
        options: [
          { label: 'on Disk', value: 'Disk' },
          { label: 'On Memory', value: 'Memory' },
        ],
      },
      defaultValue: 'Disk',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAddress,
    });

    const embeddings = decodeEmbeddings(propsValue.embeddings.data);

    const numberOfEmbeddings = embeddings.length;
    const embeddingsLen = embeddings[0].length;

    for (const embedding of embeddings) {
      if (embedding.length != embeddingsLen)
        throw new Error(
          'Embeddings must have the same length (=number of dimensions)'
        );
    }

    const embeddingsIds = JSON.parse(propsValue.embeddingsIds) as
      | string[]
      | 'Auto';

    const autoEmbeddingsIds = embeddingsIds === 'Auto';

    if (!autoEmbeddingsIds && embeddingsIds.length !== numberOfEmbeddings)
      throw new Error(
        'The number of embeddings Ids and the number of embeddings must be the same'
      );

    const payload = propsValue.payload ?? {};
    const content = propsValue.content
      ? (JSON.parse(propsValue.content.data.toString('utf-8')) as string[])
      : null;
    const points = [];

    for (let i = 0; i < numberOfEmbeddings; i++) {
      const localPayload = { ...payload };
      if (content) {
        localPayload['content'] = content[i];
      }
      points.push({
        id: autoEmbeddingsIds ? randomUUID() : embeddingsIds[i],
        payload: localPayload,
        vector: Array.from(embeddings[i]),
      });
    }

    const collections = (await client.getCollections()).collections;
    const collectionName = propsValue.collectionName as string;
    if (!collections.find((collection) => collection.name === collectionName)) {
      await client.createCollection(collectionName, {
        vectors: {
          size: embeddingsLen,
          distance: propsValue.distance as 'Dot' | 'Cosine' | 'Euclid',
          on_disk: propsValue.storage === 'Disk',
        },
        on_disk_payload: propsValue.storage === 'Disk',
      });
    }
    const response = await client.upsert(collectionName, {
      points,
      wait: true,
    });

    return response;
  },
});
