import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleMapsSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleMaps = createAction({
  auth: serpApiAuth,
  name: 'search_google_maps',
  displayName: 'Search Google Maps',
  description: 'Find local businesses and places on Google Maps for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Maps via SerpApi for local businesses and places matching a query, returning results in `local_results` (name, rating, reviews, address, phone, type, GPS coordinates, hours). Use to find businesses, restaurants, or services in an area. Pass `ll` to anchor the search to a map center; `ll` is effectively required once you paginate with `start`. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search for, e.g. "coffee shops" or "Pizza Hut".',
      required: true,
    }),
    ll: Property.ShortText({
      displayName: 'Map Center (ll)',
      description:
        'GPS coordinates of the map center as "@latitude,longitude,zoom", e.g. "@40.7455096,-74.0083012,14z". Required once you paginate with Start. Optional otherwise.',
      required: false,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Zero-based offset for pagination (multiples of 20). Requires Map Center (ll). Optional.',
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

      const searchConfig: GoogleMapsSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_MAPS,
        q: propsValue.query,
        hl: propsValue.hl,
        gl: propsValue.gl,
        start: propsValue.start,
      };

      if (propsValue.ll) {
        searchConfig.ll = propsValue.ll;
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
        search_query: propsValue.query,
      };
    }
  },
});
