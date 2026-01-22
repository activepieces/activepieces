import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addUpdateContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'addUpdateContact',
  displayName: 'Add/Update Contact',
  description:
    'Add a new contact or update an existing one. Confirmation email sent based on mailing list settings.',
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
