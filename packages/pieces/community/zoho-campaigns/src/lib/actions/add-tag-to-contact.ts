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
    const tags = await zohoCampaignsCommon.listTags({ accessToken });
    const tagExists = tags !== undefined && tags.some((tagMap) =>
      Object.values(tagMap).some((t) => t.tag_name === propsValue.tagName)
    );
    if (!tagExists) {
      await zohoCampaignsCommon.createTag({
        accessToken,
        tagName: propsValue.tagName,
      });
    }
    return await zohoCampaignsCommon.addTagToContact({
      accessToken,
      ...propsValue,
    });
  },
});
