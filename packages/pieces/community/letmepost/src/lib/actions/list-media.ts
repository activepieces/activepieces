import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth, LetmepostAuth } from '../common/auth';
import { letmepostClient } from '../common/client';
import { listMediaOutputSchema } from '../common/output-schemas';

async function collectMedia({ auth, limit, profileId }: { auth: LetmepostAuth; limit: number; profileId: string | undefined }): Promise<unknown[]> {
  const items: unknown[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  while (items.length < limit) {
    const page = await letmepostClient.request<{ data?: unknown; nextCursor?: unknown }>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/media',
      query: { limit: Math.min(limit - items.length, PAGE_SIZE), cursor, profileId },
      operation: 'list media',
    });
    const data = Array.isArray(page?.data) ? page.data : [];
    items.push(...data.slice(0, limit - items.length));
    const next = letmepostClient.optionalText(page?.nextCursor);
    if (data.length === 0 || next === undefined || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    cursor = next;
  }
  return items;
}

function limitOf(value: unknown): number {
  if (value === undefined || value === null || value === '') return DEFAULT_LIMIT;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Limit must be a whole number from 1 to ${MAX_LIMIT}.`);
  }
  return Math.min(number, MAX_LIMIT);
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const PAGE_SIZE = 100;

export const listMedia = createAction({
  auth: letmepostAuth,
  name: 'list_media',
  classification: 'SEARCH',
  displayName: 'List Media',
  description: 'List previously uploaded media assets, newest first',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists uploaded media assets, returning each id, URL, content type, size and checksum, following pages until Limit items (at most 500) are collected. Use to find an existing media id to reuse in Publish or Schedule a Post instead of uploading again with Upload Media. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of media assets to return (1 to 500). Larger values return 500.',
      required: false,
      defaultValue: 50,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Only list media in this profile. Leave empty for all media.',
      required: false,
    }),
  },
  outputSchema: listMediaOutputSchema,
  async run(context) {
    return collectMedia({
      auth: context.auth,
      limit: limitOf(context.propsValue.limit),
      profileId: letmepostClient.optionalUuid({ value: context.propsValue.profileId, label: 'Profile ID' }),
    });
  },
});
