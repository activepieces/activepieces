import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_ENRICH_MODE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const enrichPerson = createAction({
  auth: villageAuth,
  name: 'enrich_person',
  classification: 'READ',
  displayName: 'Enrich Person',
  description:
    'Get detailed profile information (name, headline, current company, location, photo, LinkedIn URL) for a person identified by LinkedIn URL or generic URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only profile lookup for one person you can already identify by their LinkedIn URL (or a generic url to auto-detect; supply exactly one). Use when you have the URL and want their profile attributes; to find candidates by criteria use Find People, and to get someone\'s email use Enrich Person Email. Cost: free when Village has the profile cached; a live fetch costs credits. Set mode to "cached_only" to never spend credits (a cache miss then returns not found). Read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.enrichPerson,
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        'LinkedIn profile URL, e.g. https://linkedin.com/in/johndoe (provide this OR url)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Generic URL — auto-detected (provide this OR linkedin_url)',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Cache Mode',
      description:
        'cached_first (default) charges credits only when Village has to fetch live data; cached_only never charges and returns not found on a cache miss; realtime_only always fetches live and charges when found.',
      required: false,
      options: { options: VILLAGE_ENRICH_MODE_OPTIONS },
    }),
  },
  async run(context) {
    const { linkedin_url, url, mode } = context.propsValue;
    if (!linkedin_url && !url) {
      throw new Error('Provide one of: linkedin_url, url');
    }
    if (linkedin_url && url) {
      throw new Error('Provide only one of: linkedin_url, url');
    }
    const identifier: Record<string, string> = linkedin_url ? { linkedin_url } : { url: url ?? '' };
    if (mode) {
      identifier['mode'] = mode;
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people/enrich`,
      body: identifier,
    });
    return response;
  },
});
