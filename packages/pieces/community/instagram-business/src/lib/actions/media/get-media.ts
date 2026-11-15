import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { getMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, MEDIA_FIELDS } from '../../common';

export const getMedia = createAction({
  auth: instagramCommon.authentication,
  outputSchema: getMediaOutputSchema,
  name: 'get_media',
  classification: 'READ',
  displayName: 'Get Media',
  description: 'Read a single Instagram post by its id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Instagram post, reel or album by its media id, returning caption, permalink, media type, media URL, timestamp and engagement counts. Use it after List Media, or when a trigger or earlier step supplied a media id. Read-only and idempotent.',
    idempotent: true,
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
      label: 'Post to read',
      icon: 'file',
      props: ['media_id'],
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
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    return instagramCommon.graphRequest({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.media_id}`,
      accessToken: page.accessToken,
      query: { fields: MEDIA_FIELDS },
    });
  },
});
