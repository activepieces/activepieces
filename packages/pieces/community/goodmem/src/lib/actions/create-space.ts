import {
  createAction,
  Property,
  InputPropertyMap,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { SpaceCreationRequest, SpaceResponseShape } from '@pairsystems/goodmem';
import { connectionRequired } from '../common/connection-required';
import { createGoodmemClient } from '../client';
import { goodmemAuth } from '../auth';

export const createSpace = createAction({
  auth: goodmemAuth,
  name: 'create_space',
  displayName: 'Create Space',
  description:
    'Create a new space or reuse an existing one. A space is a logical container for organizing related memories, configured with embedders that convert text to vector embeddings',
  audience: 'both',
  aiMetadata: {
    description:
      'Provisions a GoodMem space (a named container of memories with a configured embedder model) and returns its ID, which is required before storing or retrieving memories. Use it to set up a target space when one does not already exist. Reuses a same-named space only when its configured embedder matches. Existing chunking settings are preserved.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description:
        'A name for the space. Reuses a single matching space with the same embedder; ambiguous names require an explicit space ID in the memory actions',
      required: true,
    }),
    embedderId: Property.Dropdown<string, true, typeof goodmemAuth>({
      displayName: 'Embedder',
      description:
        'The embedder model that converts text into vector representations for similarity search',
      required: true,
      refreshers: ['auth'],
      auth: goodmemAuth,
      async options({ auth }) {
        if (!auth) {
          return connectionRequired;
        }
        const embedders = await createGoodmemClient(
          auth.props
        ).embedders.list();
        return {
          options: embedders.map((embedder) => ({
            label: `${embedder.displayName} (${embedder.modelIdentifier})`,
            value: embedder.embedderId,
          })),
        };
      },
    }),
    advancedChunking: Property.DynamicProperties({
      displayName: 'Advanced Chunking Options',
      required: false,
      refreshers: [],
      auth: PieceAuth.None(),
      props: async (): Promise<InputPropertyMap> => {
        return {
          chunkSize: Property.Number({
            displayName: 'Chunk Size',
            description:
              'Number of characters per chunk when splitting documents',
            required: false,
            defaultValue: 256,
          }),
          chunkOverlap: Property.Number({
            displayName: 'Chunk Overlap',
            description:
              'Number of overlapping characters between consecutive chunks',
            required: false,
            defaultValue: 25,
          }),
          keepStrategy: Property.StaticDropdown({
            displayName: 'Keep Separator Strategy',
            description: 'Where to attach the separator when splitting',
            required: false,
            defaultValue: 'KEEP_END',
            options: {
              disabled: false,
              options: [
                { label: 'Keep at End (default)', value: 'KEEP_END' },
                { label: 'Keep at Start', value: 'KEEP_START' },
                { label: 'Discard', value: 'DISCARD' },
              ],
            },
          }),
          lengthMeasurement: Property.StaticDropdown({
            displayName: 'Length Measurement',
            description: 'How chunk size is measured',
            required: false,
            defaultValue: 'CHARACTER_COUNT',
            options: {
              disabled: false,
              options: [
                {
                  label: 'Character Count (default)',
                  value: 'CHARACTER_COUNT',
                },
                { label: 'Token Count', value: 'TOKEN_COUNT' },
              ],
            },
          }),
        };
      },
    }),
  },
  async run(context) {
    const { name, embedderId, advancedChunking } = context.propsValue;
    const client = createGoodmemClient(context.auth.props);
    const matches: SpaceResponseShape[] = [];
    for await (const space of await client.spaces.list({ nameFilter: name })) {
      if (space.name === name) {
        matches.push(space);
      }
    }
    if (matches.length > 1) {
      throw new Error(
        'Multiple accessible spaces have this name. Select an explicit space ID in the memory actions, or choose a unique name.'
      );
    }
    const existing = matches[0];
    if (existing) {
      if (
        !existing.spaceEmbedders?.some(
          (embedder) => embedder.embedderId === embedderId
        )
      ) {
        throw new Error(
          'A space with this name already exists with a different embedder. Choose that embedder or a different space name.'
        );
      }
      return spaceResult({ space: existing, embedderId, reused: true });
    }
    const chunkSize = advancedChunking?.['chunkSize'] ?? 256;
    const keepStrategy = advancedChunking?.['keepStrategy'] ?? 'KEEP_END';
    const lengthMeasurement =
      advancedChunking?.['lengthMeasurement'] ?? 'CHARACTER_COUNT';
    if (
      typeof chunkSize !== 'number' ||
      !Number.isInteger(chunkSize) ||
      chunkSize < 1
    ) {
      throw new Error('Chunk size must be a positive integer.');
    }
    const chunkOverlap =
      advancedChunking?.['chunkOverlap'] ?? Math.min(25, chunkSize - 1);
    if (
      typeof chunkOverlap !== 'number' ||
      !Number.isInteger(chunkOverlap) ||
      chunkOverlap < 0 ||
      chunkOverlap >= chunkSize
    ) {
      throw new Error(
        'Chunk overlap must be a non-negative integer smaller than chunk size.'
      );
    }
    if (
      keepStrategy !== 'KEEP_END' &&
      keepStrategy !== 'KEEP_START' &&
      keepStrategy !== 'DISCARD'
    ) {
      throw new Error('Invalid separator strategy.');
    }
    if (
      lengthMeasurement !== 'CHARACTER_COUNT' &&
      lengthMeasurement !== 'TOKEN_COUNT'
    ) {
      throw new Error('Invalid length measurement.');
    }
    const request: SpaceCreationRequest = {
      name,
      spaceEmbedders: [{ embedderId, defaultRetrievalWeight: 1 }],
      defaultChunkingConfig: {
        recursive: {
          chunkSize,
          chunkOverlap,
          keepStrategy,
          lengthMeasurement,
          separators: ['\n\n', '\n', '. ', ' ', ''],
          separatorIsRegex: false,
        },
      },
    };
    const space = await client.spaces.create(request);
    return spaceResult({ space, embedderId, reused: false });
  },
});

function spaceResult({
  space,
  embedderId,
  reused,
}: {
  space: SpaceResponseShape;
  embedderId: string;
  reused: boolean;
}) {
  return {
    success: true,
    spaceId: space.spaceId,
    name: space.name,
    embedderId: space.spaceEmbedders?.find(
      (embedder) => embedder.embedderId === embedderId
    )?.embedderId,
    chunkingConfig: space.defaultChunkingConfig,
    reused,
  };
}
