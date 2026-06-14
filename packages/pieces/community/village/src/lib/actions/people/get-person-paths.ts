import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const getPersonPaths = createAction({
  auth: villageAuth,
  name: 'get_person_paths',
  displayName: 'Get Person Paths',
  description:
    'Find introduction paths to reach a specific person through your professional network. Provide a LinkedIn URL and get back direct connections, mutual contacts, and connection strength scores (0-100).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only lookup of warm-introduction paths to one person via your network, identified by their LinkedIn URL (or a generic url to auto-detect; supply exactly one). Use for a single target; for many targets at once use Get Person Paths (Bulk). Pure query, safe to retry.',
    idempotent: true,
  },
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        'LinkedIn profile URL of the target person, e.g. https://linkedin.com/in/johndoe (provide this OR url)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Generic URL — auto-detected (provide this OR linkedin_url)',
      required: false,
    }),
  },
  async run(context) {
    const { linkedin_url, url } = context.propsValue;
    if (!linkedin_url && !url) {
      throw new Error('Provide one of: linkedin_url, url');
    }
    if (linkedin_url && url) {
      throw new Error('Provide only one of: linkedin_url, url');
    }
    const identifier = linkedin_url ? { linkedin_url } : { url };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/paths`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: identifier,
    });
    return response.body;
  },
});
