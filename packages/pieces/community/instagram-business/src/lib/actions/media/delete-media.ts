import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const deleteMedia = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'delete_media',
  classification: 'WRITE',
  displayName: 'Delete Media',
  description: 'Permanently delete one of your Instagram posts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Instagram post, story, reel or whole carousel album belonging to the connected account. Individual items inside a carousel cannot be deleted, only the album as a whole, and the deletion cannot be undone. Not idempotent, since deleting an already deleted post fails.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({ displayName: 'Media ID', required: true }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const result = await instagramCommon.graphRequest<{ success?: boolean }>({
      method: HttpMethod.DELETE,
      resourceUri: `/${propsValue.media_id}`,
      accessToken: page.accessToken,
    });

    return { success: result.success ?? true, id: propsValue.media_id };
  },
});
