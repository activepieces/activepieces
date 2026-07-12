import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  freshnessProp,
  maxCreditsProp,
  veezeeApiCall,
  veezeeAuth,
} from '../common';

export const getRecentPostsAction = createAction({
  name: 'get_recent_posts',
  displayName: 'Get LinkedIn Posts',
  description:
    'Fetch the recent LinkedIn posts of a person or company, one page per call with a cursor for older posts. Costs 4 credits per page. Works with or without an API key.',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch the recent LinkedIn posts of one person or one company, with text, timestamps, and engagement counts. Identifier accepts a profile or company URL, a slug, a person URN, or a company website domain; the entity type is detected automatically. Use for activity checks before outreach or voice-of-company research. Not for reading one specific post by URL and not for keyword search across LinkedIn. Costs 4 credits per page; each further page (via cursor) costs the same. Works keyless under a free per-IP daily budget. Read-only lookup, safe to repeat.",
    idempotent: true,
  },
  auth: veezeeAuth,
  requireAuth: false,
  props: {
    identifier: Property.ShortText({
      displayName: 'Person or Company Identifier',
      description:
        'Person or company URL, slug, person URN, or company website domain (e.g. microsoft.com).',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor from a previous page, for older posts.',
      required: false,
    }),
    freshness: freshnessProp,
    max_credits: maxCreditsProp,
  },
  async run(context) {
    const { identifier, cursor, freshness, max_credits } = context.propsValue;

    return veezeeApiCall({
      apiKey: context.auth?.secret_text || undefined,
      method: HttpMethod.GET,
      resourceUri: '/v1/linkedin/posts',
      query: {
        identifier,
        cursor,
        freshness,
        max_credits,
      },
    });
  },
});
