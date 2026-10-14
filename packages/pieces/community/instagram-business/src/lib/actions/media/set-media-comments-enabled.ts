import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const setMediaCommentsEnabled = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'set_media_comments_enabled',
  classification: 'WRITE',
  displayName: 'Enable or Disable Comments',
  description: 'Turn commenting on or off for one post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns commenting on or off for one Instagram post belonging to the connected account. Disabling hides the existing comments from public view and blocks new ones, and re-enabling restores them. Idempotent, since setting the same state twice leaves the post unchanged.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({ displayName: 'Media ID', required: true }),
    enabled: Property.Checkbox({
      displayName: 'Comments Enabled',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const result = await instagramCommon.graphRequest<{ success?: boolean }>({
      method: HttpMethod.POST,
      resourceUri: `/${propsValue.media_id}`,
      accessToken: page.accessToken,
      body: { comment_enabled: propsValue.enabled },
    });

    return { success: result.success ?? true, id: propsValue.media_id };
  },
});
