import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const removeTag = createAction({
  auth: zohoCampaignsAuth,
  name: 'removeTag',
  displayName: 'Remove Tag',
  description: 'Remove a tag from a contact.',
  props: zohoCampaignsCommon.removeTagProperties,
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.removeTagSchema
    );
    return await zohoCampaignsCommon.removeTag({
      accessToken,
      location,
      ...propsValue,
    });
  },
});
