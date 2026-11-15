import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../common/auth';
import { alttextifyApi, AlttextifyImage, NormalizedImage, normalizeImage } from '../common/client';
import { alttextifySchemas } from '../common/schemas';

const PAGE_SIZE = 100;
const DEFAULT_MAX_RESULTS = 25;
const MAX_RESULTS_CAP = 500;

async function fetchImages({
  apiKey,
  maxResults,
}: {
  apiKey: string;
  maxResults: number;
}): Promise<NormalizedImage[]> {
  const images: NormalizedImage[] = [];
  const seen = new Set<string>();
  const pageSize = Math.min(PAGE_SIZE, maxResults);
  let page = 1;
  while (images.length < maxResults) {
    const batch = await alttextifyApi.request<AlttextifyImage[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/image',
      query: { page: String(page), limit: String(pageSize) },
      operation: 'list images',
    });
    const items = Array.isArray(batch) ? batch : [];
    for (const item of items) {
      if (images.length >= maxResults) break;
      if (seen.has(item.asset_id)) continue;
      seen.add(item.asset_id);
      images.push(normalizeImage(item));
    }
    if (items.length < pageSize) break;
    page += 1;
  }
  return images;
}

export const listImagesAction = createAction({
  name: 'list-images',
  classification: 'SEARCH',
  auth: alttextifyAuth,
  displayName: 'List Images',
  description: 'Lists your AltTextify images with their alt text, newest first. Deleted images can still be listed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists stored AltTextify image records with asset_id, alt_text, image_source, tag, created_at and status, up to max_results (default 25, max 500). Deleted records can still appear; check status when AltTextify sends it. Read-only; does not use credits. Use it to find an asset_id for Get Alt Text or Delete Image.',
    idempotent: true,
  },
  props: {
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'How many images to return, from 1 to 500. Defaults to 25.',
      required: false,
      defaultValue: DEFAULT_MAX_RESULTS,
    }),
  },
  outputSchema: alttextifySchemas.listImages,
  async run(context) {
    const requested = context.propsValue.max_results ?? DEFAULT_MAX_RESULTS;
    if (!Number.isInteger(requested) || requested < 1 || requested > MAX_RESULTS_CAP) {
      throw new Error(`Max Results must be a whole number from 1 to ${MAX_RESULTS_CAP}.`);
    }
    const images = await fetchImages({ apiKey: context.auth.secret_text, maxResults: requested });
    return { images, count: images.length };
  },
});
