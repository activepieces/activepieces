import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const unsubscribeContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'unsubscribeContact',
  displayName: 'Unsubscribe Contact',
  description: 'Remove a contact from a mailing list.',
  props: zohoCampaignsCommon.unsubscribeContactProperties(),
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.unsubscribeContactSchema
    );
    const { additionalFields, ...baseFields } = propsValue.contactinfo;

    return await zohoCampaignsCommon.unsubscribeContact({
      accessToken,
      location,
      listkey: String(propsValue.listkey),
      contactinfo: {
        ...baseFields,
        ...additionalFields,
      },
      ...(propsValue.topic_id && { topic_id: propsValue.topic_id }),
    });
  },
});
