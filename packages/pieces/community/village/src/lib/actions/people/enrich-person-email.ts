import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const enrichPersonEmail = createAction({
  auth: villageAuth,
  name: 'enrich_person_email',
  displayName: 'Enrich Person Email',
  description:
    'Find the email address for a person by LinkedIn URL or generic URL. Returns the verified email address if found, or null if unavailable.',
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
      url: `${VILLAGE_API_BASE_URL}/v2/people/enrich/emails`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: identifier,
    });
    return response.body;
  },
});
