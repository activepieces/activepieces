import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addTagToContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Apply a tag to a contact by email. Creates the tag if it doesn\'t exist.',
  props: zohoCampaignsCommon.addTagToContactProperties,
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addTagToContactSchema
    );
    const tags = await zohoCampaignsCommon.listTags({ accessToken, location });
    const tagExists = tags !== undefined && tags.some((tagMap) =>
      Object.values(tagMap).some((t) => t.tag_name === propsValue.tagName)
    );
    if (!tagExists) {
      await zohoCampaignsCommon.createTag({
        accessToken,
        location,
        tagName: propsValue.tagName,
      });
    }
    return await zohoCampaignsCommon.addTagToContact({
      accessToken,
      location,
      ...propsValue,
    });
  },
});
