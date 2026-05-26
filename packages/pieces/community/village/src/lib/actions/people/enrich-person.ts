import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const enrichPerson = createAction({
  auth: villageAuth,
  name: 'enrich_person',
  displayName: 'Enrich Person',
  description:
    'Get detailed profile information (name, headline, current company, location, photo, LinkedIn URL) for a person identified by LinkedIn URL or generic URL.',
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
      url: `${VILLAGE_API_BASE_URL}/v2/people/enrich`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: identifier,
    });
    return response.body;
  },
});
