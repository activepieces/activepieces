import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { JoggAiError, joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiCreateProduct = createAction({
  auth: joggAiAuth,
  name: 'ai_create_product',
  displayName: 'Create Product',
  description:
    'Creates a JoggAI product from a URL or from a name and description.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: joggAiOutputSchemas.aiProduct,
  aiMetadata: {
    description:
      'Creates a product on JoggAI, the first step of a product video. Either give a product page url (JoggAI analyses it; analysis can fail for some sites) or a name plus at least 3 image or video URLs in media_urls, with optional description and target audience. media_urls must be hosted by JoggAI: use the asset URL returned by Upload Media, or a URL from JoggAI results such as an avatar cover_url. External URLs are rejected with error 10400. Files ending in .mp4, .mov, .webm, .m4v or .avi are sent as videos, everything else as images. Returns the product_id for Update Product. JoggAI has no API to delete products. Not idempotent: every call creates a new product.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Product URL',
      description: 'Public product page URL to analyse.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    target_audience: Property.ShortText({
      displayName: 'Target Audience',
      required: false,
    }),
    media_urls: Property.Array({
      displayName: 'Media URLs',
      description:
        'Image or video URLs hosted by JoggAI (the asset URL from Upload Media). External URLs are rejected. At least 3 are required when no Product URL is given.',
      required: false,
    }),
  },
  async run(context) {
    const { url, name, description, target_audience, media_urls } =
      context.propsValue;
    const media = toMedia({ value: media_urls });
    if (!url?.trim()) {
      if (!name?.trim()) {
        throw new Error(
          'Provide a Product URL, or a Name with at least 3 Media URLs.'
        );
      }
      if (media.length < MIN_MEDIA) {
        throw new Error(
          `Without a Product URL, JoggAI needs at least ${MIN_MEDIA} media URLs; ${media.length} given.`
        );
      }
    }
    const data = await joggAiClient
      .request({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/v2/product',
        op: 'create product',
        body: {
          ...joggAiClient.compact({ url, name, description, target_audience }),
          ...(media.length > 0 ? { media } : {}),
        },
      })
      .catch((error: unknown) => {
        if (
          error instanceof JoggAiError &&
          error.code === 10400 &&
          error.message.includes('media.url')
        ) {
          throw new JoggAiError({
            message:
              'JoggAI create product failed (10400): JoggAI only accepts media it hosts. Upload the files with Upload Media first and pass the returned asset URLs.',
            code: error.code,
            responseBody: error.responseBody,
          });
        }
        throw error;
      });
    return { product_id: data['product_id'] ?? null };
  },
});

function toMedia({ value }: { value: unknown }): ProductMedia[] {
  const items = toList({ value });
  return items.flatMap((item, index) => {
    const text = typeof item === 'string' ? item.trim() : '';
    if (!text) {
      return [];
    }
    let parsed: URL;
    try {
      parsed = new URL(text);
    } catch {
      throw new Error(`Media URL ${index + 1} is not a valid URL.`);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(
        `Media URL ${index + 1} must start with http:// or https://.`
      );
    }
    const fileName =
      parsed.pathname.split('/').filter(Boolean).pop() ?? `media-${index + 1}`;
    const isVideo = VIDEO_EXTENSIONS.some((extension) =>
      fileName.toLowerCase().endsWith(extension)
    );
    return [{ type: isVideo ? 2 : 1, name: fileName, url: text }];
  });
}

function toList({ value }: { value: unknown }): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    throw new Error('Media URLs must be a list of URLs.');
  }
  const text = value.trim();
  if (!text) {
    return [];
  }
  if (text.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Media URLs must be a JSON list of URLs, or URLs separated by commas or new lines.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Media URLs must be a list of URLs.');
    }
    return parsed;
  }
  return text.split(/[\n,]/);
}

const MIN_MEDIA = 3;
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi'];

type ProductMedia = { type: number; name: string; url: string };
