import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupPerson = createAction({
  auth: pubrioAuth,
  name: 'lookup_person',
  displayName: 'Lookup Person',
  description:
    "Look up a person's professional profile by LinkedIn URL or Pubrio ID",
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'People Search ID', value: 'people_search_id' },
        ],
      },
    }),
    value: Property.ShortText({ displayName: 'Value', required: true }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      [context.propsValue.lookup_type]: context.propsValue.value,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/people/lookup',
      body
    );
  },
});
