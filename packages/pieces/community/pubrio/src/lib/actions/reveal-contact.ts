import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const revealContact = createAction({
  auth: pubrioAuth,
  name: 'reveal_contact',
  displayName: 'Reveal Contact',
  description: 'Reveal email or phone number for a person (uses credits)',
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'People Search ID', value: 'people_search_id' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
      description: 'People Search ID or LinkedIn URL',
    }),
    people_contact_types: Property.StaticMultiSelectDropdown({
      displayName: 'Contact Types',
      required: false,
      options: {
        options: [
          { label: 'Work Email', value: 'email-work' },
          { label: 'Personal Email', value: 'email-personal' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      [context.propsValue.lookup_type]: context.propsValue.value,
    };
    if (
      context.propsValue.people_contact_types &&
      context.propsValue.people_contact_types.length > 0
    ) {
      body['people_contact_types'] = context.propsValue.people_contact_types;
    }
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/redeem/people',
      body
    );
  },
});
