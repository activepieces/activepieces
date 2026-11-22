import { createAction } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi, braveNormalize } from '../common/client';
import { IMAGE_SAFESEARCH_VALUES, braveProps } from '../common/props';

export const searchImagesAction = createAction({
  auth: braveSearchAuth,
  name: 'search_images',
  classification: 'SEARCH',
  displayName: 'Search Images',
  description: 'Find images with Brave Image Search.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches images with Brave Image Search: pictures of people, places, things, design ideas or art inspiration. Returns results with title, url (page hosting the image), source, image_url (full image), thumbnail_url, width, height and confidence, plus count and might_be_offensive. count 1-200 (default 50); image search has no paging, so raise count for more, and Brave may return fewer than asked. safesearch is off or strict only (default strict). Read-only; one billed Brave request per call.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Images Returned', format: 'number' },
      { key: 'might_be_offensive', label: 'Might Be Offensive', format: 'boolean' },
      {
        key: 'results',
        label: 'Images',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'url', label: 'Page URL', format: 'url' },
          { key: 'source', label: 'Source' },
          { key: 'image_url', label: 'Image URL', format: 'image' },
          { key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
          { key: 'width', label: 'Width', format: 'number' },
          { key: 'height', label: 'Height', format: 'number' },
          { key: 'confidence', label: 'Confidence', description: 'low, medium or high relevance.' },
        ],
      },
    ],
  },
  props: {
    query: braveProps.query({ maxChars: 400, maxWords: 50 }),
    count: braveProps.count({
      min: 1,
      max: 200,
      defaultValue: 50,
      description: 'How many images to return (1-200, default 50). Image search has no paging; Brave may return fewer.',
    }),
    country: braveProps.country(),
    search_lang: braveProps.searchLanguage(),
    safesearch: braveProps.imageSafesearch(),
  },
  async run(context) {
    const { query, count, country, search_lang, safesearch } = context.propsValue;
    const params = braveApi.buildQuery({
      q: braveApi.validateQuery({ query, maxChars: 400, maxWords: 50 }),
      count: braveApi.resolveInteger({ value: count, label: 'Number of Results', min: 1, max: 200, defaultValue: 50 }),
      country,
      search_lang,
      safesearch: braveApi.resolveChoice({ value: safesearch, allowed: IMAGE_SAFESEARCH_VALUES, label: 'Safe Search', defaultValue: 'strict' }),
    });
    const body = await braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/images/search',
      query: params,
      operation: 'image search',
    });
    return braveNormalize.images(body);
  },
});
