import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addTagToContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description:
    "Apply a tag to a contact by email. Creates the tag if it doesn't exist.",
  audience: 'both',
  aiMetadata: {
    description:
      'Applies a tag to a contact identified by email address, first creating the tag in the account if it does not already exist. Use to label or segment a subscriber. Idempotent: re-applying the same tag to the same contact leaves the contact in the same tagged state.',
    idempotent: true,
  },
  props: zohoCampaignsCommon.addTagToContactProperties,
  async run({ auth, propsValue }) {
    const location = auth.props?.['location'] as string || 'zoho.com';
    const accessToken = auth.access_token;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addTagToContactSchema
    );
    const tags = await zohoCampaignsCommon.listTags({ accessToken, location });
    const tagExists =
      tags !== undefined &&
      tags.some((tagMap) =>
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
