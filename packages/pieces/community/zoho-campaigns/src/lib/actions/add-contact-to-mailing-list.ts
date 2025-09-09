import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addContactToMailingList = createAction({
  auth: zohoCampaignsAuth,
  name: 'addContactToMailingList',
  displayName: 'Add Contact to Mailing List',
  description: 'Add contacts to your mailing lists.',
  props: zohoCampaignsCommon.addContactToMailingListProperties(),
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addContactToMailingListSchema
    );
    return await zohoCampaignsCommon.addContactToMailingList({
      accessToken,
      location,
      listkey: String(propsValue.listkey),
      emailids: propsValue.emails.join(','),
    });
  },
});
