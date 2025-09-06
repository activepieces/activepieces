import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const removeTag = createAction({
  auth: zohoCampaignsAuth,
  name: 'removeTag',
  displayName: 'Remove Tag',
  description: 'Remove a tag from a contact.',
  props: zohoCampaignsCommon.removeTagProperties,
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.removeTagSchema
    );
    return await zohoCampaignsCommon.removeTag({
      accessToken,
      ...propsValue,
    });
  },
});
