import { createAction, Property } from '@activepieces/pieces-framework';

import { publishedMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const publishCarousel = createAction({
  auth: instagramCommon.authentication,
  outputSchema: publishedMediaOutputSchema,
  name: 'publish_carousel',
  classification: 'WRITE',
  displayName: 'Publish Carousel',
  description: 'Publish a carousel album of up to 10 photos or videos.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a single Instagram carousel album containing between 2 and 10 photos or videos, given their public URLs, with an optional caption. Each item is uploaded as its own container first, so a long list takes proportionally longer. A carousel counts as one post against the 100-per-24-hours publishing quota. Not idempotent — each call publishes a new album.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    items: Property.Array({
      displayName: 'Items',
      description: 'Between 2 and 10 photos or videos, in the order they should appear.',
      required: true,
      properties: {
        url: Property.ShortText({
          displayName: 'Media URL',
          description: 'Public URL of the photo (JPG) or video.',
          required: true,
        }),
        is_video: Property.Checkbox({
          displayName: 'Is Video',
          description: 'Turn on when this item is a video rather than a photo.',
          required: false,
          defaultValue: false,
        }),
      },
    }),
    caption: instagramCommon.caption,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const items = propsValue.items ?? [];

    if (items.length < 2 || items.length > 10) {
      throw new Error(
        `A carousel needs between 2 and 10 items, but ${items.length} were supplied.`,
      );
    }

    const childIds: string[] = [];
    for (const item of items) {
      const parsed = parseCarouselItem(item);
      const childId = await instagramCommon.createContainer({
        page,
        body: {
          ...(parsed.isVideo ? { video_url: parsed.url } : { image_url: parsed.url }),
          ...(parsed.isVideo ? { media_type: 'VIDEO' } : {}),
          is_carousel_item: true,
        },
      });
      await instagramCommon.waitForContainer({ containerId: childId, page });
      childIds.push(childId);
    }

    return instagramCommon.publishMedia({
      page,
      body: {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption: propsValue.caption,
      },
    });
  },
});

function parseCarouselItem(item: unknown): { url: string; isVideo: boolean } {
  if (typeof item !== 'object' || item === null) {
    throw new Error('Each carousel item must supply a Media URL.');
  }
  const record: Record<string, unknown> = { ...item };
  const url = record['url'];
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Each carousel item must supply a Media URL.');
  }
  return { url, isVideo: record['is_video'] === true };
}
