import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addTagToContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Apply a tag to a contact by email.',
  props: zohoCampaignsCommon.addTagToContactProperties,
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addTagToContactSchema
    );
    return await zohoCampaignsCommon.addTagToContact({
      accessToken,
      ...propsValue,
    });
  },
});
