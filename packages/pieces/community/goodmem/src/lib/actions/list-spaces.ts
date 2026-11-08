import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi } from '../common/client';

export const listSpaces = createAction({
  auth: goodmemAuth,
  name: 'list_spaces',
  classification: 'READ',
  displayName: 'List Spaces',
  description: 'List the spaces in your GoodMem account, optionally filtered by name.',
  audience: 'both',
  aiMetadata: { description: 'Lists GoodMem spaces (memory containers) with their IDs, names and embedders. Use it to find the space ID needed by Store Memory, List Memories or Retrieve Memories. Optionally filter by name. Returns up to Maximum Results spaces plus a nextToken when more exist; pass that token back to get the next page. Read-only and idempotent.', idempotent: true },
  outputSchema: goodmemOutputSchemas.listSpaces,
  props: {
    name: Property.ShortText({
      displayName: 'Name Filter',
      description: 'Only return spaces whose name matches this glob, e.g. project-*',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'How many spaces to return (1-1000)',
      required: false,
      defaultValue: 100,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Page Token',
      description: 'The nextToken from a previous call, for the next page',
      required: false,
    }),
  },
  async run(context) {
    const { name, maxResults, nextToken } = context.propsValue;
    const size = maxResults ?? 100;
    if (!Number.isInteger(size) || size < 1 || size > 1000) {
      throw new Error('Maximum Results must be a whole number between 1 and 1000');
    }
    const page = await goodmemApi.listSpacesPage({
      auth: extractAuthFromContext(context.auth),
      name: name?.trim() || undefined,
      maxResults: size,
      nextToken: nextToken?.trim() || undefined,
    });
    return { spaces: page.spaces, count: page.spaces.length, nextToken: page.nextToken ?? null };
  },
});
