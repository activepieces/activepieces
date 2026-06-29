import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleLocalServicesSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleLocalServices = createAction({
  auth: serpApiAuth,
  name: 'search_google_local_services',
  displayName: 'Search Google Local Services',
  description: 'Find local-services-ads providers for a service category in a region.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Local Services Ads via SerpApi for vetted service providers (e.g. plumbers, electricians) matching a query, returning results in `local_ads`. Requires a Data CID identifying the geographic region; this is an opaque id with no resolver in this piece, so it must be supplied by the caller. Read-only and idempotent; requires the query, the Data CID, and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The service category to search for, e.g. "plumber" or "electrician".',
      required: true,
    }),
    data_cid: Property.ShortText({
      displayName: 'Data CID',
      description:
        'Opaque region identifier (data_cid) for the local-services area. Must be supplied by the caller; this piece has no resolver for it.',
      required: true,
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

      const searchConfig: GoogleLocalServicesSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_LOCAL_SERVICES,
        q: propsValue.query,
        data_cid: propsValue.data_cid,
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
