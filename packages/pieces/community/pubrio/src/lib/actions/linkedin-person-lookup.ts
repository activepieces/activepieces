import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const linkedinPersonLookup = createAction({
  auth: pubrioAuth,
  name: 'linkedin_person_lookup',
  displayName: 'People LinkedIn Lookup',
  description: 'Real-time LinkedIn person lookup by LinkedIn URL',
  props: {
    people_linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      required: true,
      description: 'Person LinkedIn profile URL',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      people_linkedin_url: context.propsValue.people_linkedin_url,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/people/linkedin/lookup',
      body
    );
  },
});
