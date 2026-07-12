import { createAction, Property } from '@activepieces/pieces-framework';

export const chunkArray = createAction({
  name: 'chunk_array',
  displayName: 'Chunk Array',
  description: 'Split an array into smaller arrays',
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    items: Property.Array({
      displayName: 'Array',
      description: 'The array to split',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Split by',
      required: true,
      defaultValue: 'size',
      options: {
        options: [
          { label: 'Items per chunk', value: 'size' },
          { label: 'Number of chunks', value: 'count' },
        ],
      },
    }),
    n: Property.Number({
      displayName: 'N',
      description: 'Items per chunk, or number of chunks (depending on mode)',
      required: true,
      defaultValue: 2,
    }),
  },
  async run(ctx) {
    const { items, mode, n } = ctx.propsValue;
    if (n < 1) {
      throw new Error('N must be at least 1');
    }
    const size = mode === 'count' ? Math.max(1, Math.ceil(items.length / n)) : n;
    const chunks: unknown[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  },
});
