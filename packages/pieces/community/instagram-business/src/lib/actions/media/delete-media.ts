import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const deleteMedia = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'delete_media',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Media',
  description: 'Permanently delete one of your Instagram posts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Instagram post, story, reel or whole carousel album belonging to the connected account. Individual items inside a carousel cannot be deleted, only the album as a whole, and the deletion cannot be undone. Not idempotent, since deleting an already deleted post fails.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'account',
      display: 'section',
      label: 'Account',
      icon: 'user',
      props: ['page'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Post to delete',
      icon: 'trash',
      props: ['media_id', 'delete_info'],
    },
  ],
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The id from List Media or a publish step.',
      placeholder: '17895695668004550',
      required: true,
    }),
    delete_info: Property.MarkDown({
      value: "Deleted posts can't be restored.",
      variant: MarkdownVariant.INFO,
    }),
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
