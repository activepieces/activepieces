import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getPersonPaths = createAction({
  auth: villageAuth,
  name: 'get_person_paths',
  classification: 'READ',
  displayName: 'Get Person Paths',
  description:
    'Find introduction paths to reach a specific person through your professional network. Provide a LinkedIn URL and get back direct connections, mutual contacts, and connection strength scores (0-100).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only lookup of warm-introduction paths to one person via your network, identified by their LinkedIn URL (or a generic url to auto-detect; supply exactly one). Costs 2 credits when paths are found (free if this person was opened in the last 30 days). Read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getPersonPaths,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people/paths`,
      body: identifier,
    });
    return response;
  },
});
