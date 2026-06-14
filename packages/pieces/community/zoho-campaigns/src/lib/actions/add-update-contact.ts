import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addUpdateContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'addUpdateContact',
  displayName: 'Add/Update Contact',
  description:
    'Add a new contact or update an existing one. Confirmation email sent based on mailing list settings.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a contact to a mailing list or updates the existing contact matched by email, setting standard and custom fields. Use to create or keep a subscriber record current. Effectively an upsert keyed on email, so repeating with the same input converges to the same state and is idempotent; note a confirmation email may be sent depending on the list settings.',
    idempotent: true,
  },
  props: zohoCampaignsCommon.addUpdateContactProperties(),
  async run({ auth, propsValue }) {
    const location = auth.props?.['location'] as string || 'zoho.com';
    const accessToken = auth.access_token;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addUpdateContactSchema
    );
    const { additionalFields, ...baseFields } = propsValue.contactinfo;

    return await zohoCampaignsCommon.addUpdateContact({
      accessToken,
      location,
      ...propsValue,
      listkey: String(propsValue.listkey),
      contactinfo: {
        ...baseFields,
        ...additionalFields,
      },
    });
  },
});
