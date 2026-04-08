import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const batchRedeemContacts = createAction({
  auth: pubrioAuth,
  name: 'batch_redeem_contacts',
  displayName: 'Batch Redeem Contacts',
  description:
    'Reveal email or phone numbers for multiple people at once (uses credits)',
  props: {
    peoples: Property.ShortText({
      displayName: 'People Search IDs',
      required: true,
      description: 'Comma-separated people search IDs',
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
      peoples: splitComma(context.propsValue.peoples),
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
      '/redeem/people/batch',
      body
    );
  },
});
