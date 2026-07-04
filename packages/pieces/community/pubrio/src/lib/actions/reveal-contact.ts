import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const revealContact = createAction({
  auth: pubrioAuth,
  name: 'reveal_contact',
  displayName: 'Reveal Contact',
  description: 'Reveal email or phone number for a person (uses credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Reveal a person's contact details (work/personal email and/or phone) for a single individual identified by people_search_id or LinkedIn URL. This consumes account credits and is not idempotent in cost, so call it only once contacts are actually needed. Use for one person at a time after locating them via Search People or Lookup Person.",
    idempotent: false,
  },
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
