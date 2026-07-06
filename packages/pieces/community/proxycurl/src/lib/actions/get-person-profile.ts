import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const getPersonProfileAction = createAction({
  name: 'get_person_profile',
  displayName: 'Get Person Profile',
  description: 'Fetch a LinkedIn person profile from Proxycurl.',
  audience: 'both',
  aiMetadata: { description: 'Enrich a single individual by fetching their LinkedIn person profile from Proxycurl. Choose this when you already have a person\'s public LinkedIn profile URL and need their structured profile data; for finding people without a known URL use Search People instead. Requires the public LinkedIn profile URL (e.g. https://www.linkedin.com/in/williamhgates). Read-only lookup, safe to repeat.', idempotent: true },
  auth: proxycurlAuth,
  props: {
    linkedin_profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Public LinkedIn profile URL, for example https://www.linkedin.com/in/williamhgates',
      required: true,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/v2/linkedin',
      query: {
        url: context.propsValue.linkedin_profile_url,
      },
    });
  },
});
