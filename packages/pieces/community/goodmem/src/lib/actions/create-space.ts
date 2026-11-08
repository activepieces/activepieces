import { createAction, Property, InputPropertyMap, PieceAuth } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { embedderDropdown, extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders, goodmemParsers } from '../common/client';

export const createSpace = createAction({
  auth: goodmemAuth,
  name: 'create_space',
  classification: 'WRITE',
  displayName: 'Create Space',
  description: 'Create a new space or reuse an existing one. A space is a logical container for organizing related memories, configured with embedders that convert text to vector embeddings',
  audience: 'human',
  outputSchema: goodmemOutputSchemas.space,
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'A unique name for the space. If a space with this name already exists, its ID will be returned instead of creating a duplicate',
      required: true,
    }),
    embedderId: embedderDropdown,
    advancedChunking: Property.DynamicProperties({
      displayName: 'Advanced Chunking Options',
      required: false,
      refreshers: [],
      auth: PieceAuth.None(),
      props: async (): Promise<InputPropertyMap> => {
        return {
          chunkSize: Property.Number({
            displayName: 'Chunk Size',
            description: 'Number of characters per chunk when splitting documents',
            required: false,
            defaultValue: 256,
          }),
          chunkOverlap: Property.Number({
            displayName: 'Chunk Overlap',
            description: 'Number of overlapping characters between consecutive chunks',
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
                { label: 'Character Count (default)', value: 'CHARACTER_COUNT' },
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
    const auth = extractAuthFromContext(context.auth);
    const chunkingConfig = goodmemBuilders.buildChunkingConfig({
      chunkSize: goodmemParsers.readNumber({ source: advancedChunking, key: 'chunkSize' }),
      chunkOverlap: goodmemParsers.readNumber({ source: advancedChunking, key: 'chunkOverlap' }),
      keepStrategy: goodmemParsers.readString({ source: advancedChunking, key: 'keepStrategy' }),
      lengthMeasurement: goodmemParsers.readString({ source: advancedChunking, key: 'lengthMeasurement' }),
    });
    return goodmemApi.createOrReuseSpace({
      auth,
      name: goodmemBuilders.requireText({ value: name, label: 'Space Name' }),
      embedderId: goodmemBuilders.requireText({ value: embedderId, label: 'Embedder' }),
      chunkingConfig,
    });
  },
});
