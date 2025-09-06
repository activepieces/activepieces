import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const unsubscribeContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'unsubscribeContact',
  displayName: 'Unsubscribe Contact',
  description: 'Remove a contact from a mailing list.',
  props: zohoCampaignsCommon.unsubscribeContactProperties(),
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.unsubscribeContactSchema
    );
    return await zohoCampaignsCommon.unsubscribeContact({
      accessToken,
      ...propsValue,
      listkey: String(propsValue.listkey),
    });
  },
});
