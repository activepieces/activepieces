import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listCarouselChildrenOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const listCarouselChildren = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listCarouselChildrenOutputSchema,
  name: 'list_carousel_children',
  classification: 'SEARCH',
  displayName: 'List Carousel Children',
  description: 'List the individual items inside a carousel album post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the individual photos and videos inside one Instagram carousel album, given the album media id. Only works on media whose media_type is CAROUSEL_ALBUM; other posts return an empty list. Read-only and idempotent.',
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
      label: 'Carousel',
      icon: 'file',
      props: ['media_id'],
    },
  ],
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The id of a carousel post, from List Media.',
      placeholder: '17895695668004550',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.media_id}/children`,
      accessToken: page.accessToken,
      query: { fields: 'id,media_type,media_url,permalink,timestamp,thumbnail_url' },
    });

    const children = response.data ?? [];
    return { children, count: children.length };
  },
});
