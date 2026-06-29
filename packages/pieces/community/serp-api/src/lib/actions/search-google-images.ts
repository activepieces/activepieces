import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleImagesSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleImages = createAction({
  auth: serpApiAuth,
  name: 'search_google_images',
  displayName: 'Search Google Images',
  description: 'Discover images on Google Images for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Images via SerpApi for a query, returning results in `images_results` (thumbnail URL, full-resolution image URL, title, and source page). Use to discover images, find a full-resolution URL, or locate the page an image came from. Page through results with the page index. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What images to search for, e.g. "golden gate bridge".',
      required: true,
    }),
    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of image results to return (up to 100). Optional.',
      required: false,
    }),
    ijn: Property.Number({
      displayName: 'Page Index',
      description: 'Zero-based page index for image pagination (0 = first page, 1 = second, ...). Optional.',
      required: false,
    }),
    hl: Property.ShortText({
      displayName: 'Language (hl)',
      description: 'Two-character lowercase ISO 639-1 language code, e.g. "en", "es". Optional.',
      required: false,
    }),
    gl: Property.ShortText({
      displayName: 'Country (gl)',
      description: 'Two-character lowercase ISO 3166-1 country code, e.g. "us", "gb". Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const client = new SerpApiClient({
        defaultTimeout: 30000,
        defaultRetries: 3,
        defaultRetryDelay: 1000,
        enableLogging: false,
      });

      const searchConfig: GoogleImagesSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_IMAGES,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
        num: propsValue.num_results,
        ijn: propsValue.ijn,
      };

      const response = await client.executeSearch(searchConfig);

      return {
        success: true,
        ...response,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
        search_query: propsValue.query,
      };
    }
  },
});
