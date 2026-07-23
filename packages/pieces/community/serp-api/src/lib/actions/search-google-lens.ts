import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleLensSearchConfig, SerpApiEngine } from '../types';
import { searchGoogleLensOutputSchema } from '../output-schemas';

export const searchGoogleLens = createAction({
  auth: serpApiAuth,
  name: 'search_google_lens',
  displayName: 'Search Google Lens',
  description: 'Run a reverse-image (visual) search on Google Lens for an image URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a Google Lens reverse-image search via SerpApi for a publicly accessible image URL, returning visual matches and related content (in `visual_matches` and related keys). Use to identify what is in an image, find where an image appears online, or find visually similar items. Optionally refine with a text query. Read-only and idempotent; requires the image URL and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchGoogleLensOutputSchema,
  props: {
    url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Publicly accessible URL of the image to analyze, e.g. "https://example.com/photo.jpg".',
      required: true,
    }),
    query: Property.ShortText({
      displayName: 'Text Refinement',
      description: 'Optional text query to refine the visual search.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code for results, e.g. "us", "gb". Optional.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Search Type',
      description: 'Lens search type, e.g. "all" (default), "products", or "visual_matches". Optional.',
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

      const searchConfig: GoogleLensSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_LENS,
        url: propsValue.url,
      };

      if (propsValue.query) {
        searchConfig.q = propsValue.query;
      }

      if (propsValue.country) {
        searchConfig.country = propsValue.country;
      }

      if (propsValue.type) {
        searchConfig.type = propsValue.type;
      }

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
        image_url: propsValue.url,
      };
    }
  },
});
