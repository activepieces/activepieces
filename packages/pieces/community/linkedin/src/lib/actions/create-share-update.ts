import { createAction } from '@activepieces/pieces-framework';
import { linkedinCommon, publishMemberPost } from '../common';
import { linkedinAuth } from '../..';
import { createShareUpdateActionOutputSchema } from '../output-schemas';

export const createShareUpdate = createAction({
  auth: linkedinAuth,
  name: 'create_share_update',
  classification: 'WRITE',
  displayName: 'Create Share Update',
  description: 'Create a share update on LinkedIn',
  audience: 'human',
  aiMetadata: {
    description:
      "Publishes a new post to the authenticated user's personal LinkedIn profile, with optional image, link preview, and visibility setting. Use this to share content as an individual member (not a company page — use Create Company Update for that). Not idempotent: each call creates a separate post, so calling it again with the same text produces a duplicate.",
    idempotent: false,
  },
  props: {
    text: linkedinCommon.text,
    visibility: linkedinCommon.visibility,
    imageUrl: linkedinCommon.imageUrl,
    link: linkedinCommon.link,
    linkTitle: linkedinCommon.linkTitle,
    linkDescription: linkedinCommon.linkDescription,
  },
  outputSchema: createShareUpdateActionOutputSchema,

  run: async (context) => {
    const { text, link, linkDescription, linkTitle, visibility, imageUrl } =
      context.propsValue;

    return await publishMemberPost({
      accessToken: context.auth.access_token,
      idToken: context.auth.data.id_token,
      text,
      visibility,
      imageFile: imageUrl,
      link,
      linkTitle,
      linkDescription,
    });
  },
});
