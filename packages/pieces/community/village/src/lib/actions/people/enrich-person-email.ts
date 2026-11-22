import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const enrichPersonEmail = createAction({
  auth: villageAuth,
  name: 'enrich_person_email',
  classification: 'READ',
  displayName: 'Enrich Person Email',
  description:
    'Find the email address for a person by LinkedIn URL or generic URL. Returns the verified email address if found, or null if unavailable.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a single person\'s email address from exactly one identifier — either a LinkedIn URL or a generic URL (provide one, not both). Costs 1 credit per email found (nothing when none is found). Read-only. Use for email discovery specifically; use Enrich Person for profile data.',
    idempotent: true,
  },
  outputSchema: villageSchemas.enrichPersonEmail,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people/enrich/emails`,
      body: identifier,
    });
    return response;
  },
});
