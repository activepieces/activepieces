import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../common/auth';
import { alttextifyApi, AlttextifyError, AlttextifyImage, toDataUri } from '../common/client';
import { alttextifySchemas } from '../common/schemas';

const MATCH_WINDOW_MS = 2000;
const FALLBACK_WINDOW_MS = 30000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|bmp|webp|avif|svg)$/i;

export const generateAltTextAction = createAction({
  name: 'generate-alt-text',
  classification: 'WRITE',
  auth: alttextifyAuth,
  displayName: 'Generate Image Alt Text',
  description: 'Generates alt text for an image file or image URL. Uses one credit per call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates accessibility or SEO alt text for one image with AltTextify and stores it as a new image record. Provide exactly one of image (a file) or image_url (a public JPEG, PNG, GIF, WEBP or BMP URL, at least 50x50 px, at most 15 MB). Optional: lang (ISO 639-1, e.g. "fr"), max_chars, keywords and negative_keywords (English, 1-2 are used), start_with/end_with text, domain_context, and e-commerce product details. Every call consumes one credit and creates a new record, so retries are not safe. Returns asset_id (the stored record ID, usable with Get Alt Text and Delete Image), job_id and alt_text; asset_id input is currently ignored by AltTextify.',
    idempotent: false,
  },
  props: {
    image: Property.File({
      displayName: 'Image File',
      description: 'Image to describe. Fill this or Image URL, not both.',
      required: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description:
        'Direct image link (.jpg, .png, .webp…); if it fails, upload the file instead. Fill this or Image File, not both. URLs without an image file extension (for example ?fm=jpg links) are rejected by AltTextify.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      required: false,
      defaultValue: 'en',
      description: 'Two-letter language code for the alt text, such as en, fr or de.',
    }),
    max_chars: Property.Number({
      displayName: 'Max Characters',
      required: false,
      description: 'Maximum length of the alt text. Leave empty for the AltTextify default.',
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      required: false,
      description: 'English keywords to work into the alt text for SEO. One or two are used.',
    }),
    negative_keywords: Property.Array({
      displayName: 'Negative Keywords',
      required: false,
      description: 'English keywords to keep out of the alt text.',
    }),
    start_with: Property.ShortText({
      displayName: 'Start With',
      required: false,
      description: 'Text the alt text should begin with.',
    }),
    end_with: Property.ShortText({
      displayName: 'End With',
      required: false,
      description: 'Text the alt text should end with.',
    }),
    domain_context: Property.ShortText({
      displayName: 'Domain Context',
      required: false,
      description: 'Subject area of the image, such as real estate or fashion, to guide wording.',
    }),
    asset_id: Property.ShortText({
      displayName: 'Custom Asset ID',
      required: false,
      description:
        'Currently ignored by AltTextify (it assigns its own ID). Kept for compatibility; use the Asset ID returned by this action instead.',
    }),
    run_ocr: Property.StaticDropdown<string>({
      displayName: 'Read Text in Image (E-commerce)',
      required: false,
      description: 'Run OCR on product images so printed text is used. Leave empty for the default.',
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    product_name: Property.ShortText({
      displayName: 'Product Name (E-commerce)',
      description: 'Product name to mention in the alt text, e.g. "Trail Running Shoe".',
      required: false,
    }),
    product_brand: Property.ShortText({
      displayName: 'Product Brand (E-commerce)',
      description: 'Product brand to mention in the alt text, e.g. "Nike".',
      required: false,
    }),
    product_color: Property.ShortText({
      displayName: 'Product Color (E-commerce)',
      description: 'Product color to mention in the alt text, e.g. "Blue".',
      required: false,
    }),
    product_size: Property.ShortText({
      displayName: 'Product Size (E-commerce)',
      description: 'Product size to mention in the alt text, e.g. "Medium".',
      required: false,
    }),
  },
  outputSchema: alttextifySchemas.generate,
  async run(context) {
    const props = context.propsValue;
    const imageUrl = trimmed(props.image_url);
    const hasFile = props.image !== null && props.image !== undefined;

    if (hasFile && imageUrl) {
      throw new Error('Fill only one of Image File or Image URL, not both.');
    }
    if (!hasFile && !imageUrl) {
      throw new Error('Fill Image File or Image URL.');
    }
    if (props.max_chars !== undefined && props.max_chars !== null) {
      if (!Number.isInteger(props.max_chars) || props.max_chars < 1) {
        throw new Error('Max Characters must be a whole number greater than 0.');
      }
    }

    const image = imageUrl ?? toDataUri(props.image);
    if (!imageUrl && approximateBytes(image) > MAX_IMAGE_BYTES) {
      throw new Error('Image File is larger than 15 MB, the AltTextify limit. Resize or compress it first; no credit was used.');
    }
    const body: Record<string, unknown> = {
      async: false,
      image,
    };
    const lang = trimmed(props.lang);
    if (lang) body['lang'] = lang;
    if (props.max_chars !== undefined && props.max_chars !== null) body['max_chars'] = props.max_chars;
    const keywords = cleanList(props.keywords);
    if (keywords.length > 0) body['keywords'] = keywords;
    const negativeKeywords = cleanList(props.negative_keywords);
    if (negativeKeywords.length > 0) body['negative_keywords'] = negativeKeywords;
    const assetId = trimmed(props.asset_id);
    if (assetId) body['asset_id'] = assetId;
    const startWith = trimmed(props.start_with);
    if (startWith) body['start_with'] = startWith;
    const endWith = trimmed(props.end_with);
    if (endWith) body['end_with'] = endWith;
    const domainContext = trimmed(props.domain_context);
    if (domainContext) body['domain_context'] = domainContext;

    const ecommerce = buildEcommerce({
      runOcr: props.run_ocr,
      name: trimmed(props.product_name),
      brand: trimmed(props.product_brand),
      color: trimmed(props.product_color),
      size: trimmed(props.product_size),
    });
    if (ecommerce) body['ecommerce'] = ecommerce;

    const response = await alttextifyApi
      .request<GenerateResponse>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: imageUrl ? '/image/url' : '/image/raw',
        body,
        operation: 'generate alt text',
      })
      .catch((error: unknown) => {
        if (
          imageUrl &&
          error instanceof AlttextifyError &&
          error.httpStatus === 400 &&
          !hasImageExtension(imageUrl)
        ) {
          throw new AlttextifyError({
            message: `${error.message} The Image URL path does not end in an image extension such as .jpg or .png; AltTextify only accepts such URLs. Use a direct image link or upload the image as a file.`,
            responseBody: error.responseBody,
            httpStatus: error.httpStatus,
          });
        }
        throw error;
      });

    const altText = Array.isArray(response.alt_text) ? response.alt_text.join('\n') : response.alt_text ?? '';
    const createdAt = response.created_at ?? null;
    const match = await findStoredImage({
      apiKey: context.auth.secret_text,
      altText,
      createdAt,
    });
    const stored = match?.image;
    return {
      asset_id: stored?.asset_id ?? response.asset_id,
      job_id: response.asset_id,
      alt_text: altText,
      created_at: stored?.created_at ?? createdAt,
      note: match?.exact
        ? null
        : match
          ? 'Matched the stored image by time only (alt text differed); if other images were generated at the same moment, check asset_id with List Images.'
          : 'Could not find the stored image record, so asset_id is the job ID. Use List Images to find the record.',
    };
  },
});

async function findStoredImage({
  apiKey,
  altText,
  createdAt,
}: {
  apiKey: string;
  altText: string;
  createdAt: string | null;
}): Promise<{ image: AlttextifyImage; exact: boolean } | undefined> {
  let images: AlttextifyImage[];
  try {
    const result = await alttextifyApi.request<AlttextifyImage[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/image',
      query: { page: '1', limit: '10' },
      operation: 'list images',
    });
    images = Array.isArray(result) ? result : [];
  } catch {
    return undefined;
  }
  const targetMs = createdAt ? Date.parse(createdAt) : Number.NaN;
  const withDistance = images
    .map((image) => {
      const ms = typeof image.created_at === 'string' ? Date.parse(image.created_at) : Number.NaN;
      return { image, distance: Number.isNaN(ms) || Number.isNaN(targetMs) ? Number.POSITIVE_INFINITY : Math.abs(ms - targetMs) };
    })
    .sort((a, b) => a.distance - b.distance);
  const exact = withDistance.find(
    (entry) => entry.distance <= MATCH_WINDOW_MS && firstAltText(entry.image) === altText,
  );
  if (exact) return { image: exact.image, exact: true };
  const closest = withDistance[0];
  return closest && closest.distance <= FALLBACK_WINDOW_MS ? { image: closest.image, exact: false } : undefined;
}

function firstAltText(image: AlttextifyImage): string {
  if (Array.isArray(image.alt_text)) return image.alt_text[0] ?? '';
  return image.alt_text ?? '';
}

function approximateBytes(dataUri: string): number {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}

function trimmed(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

function hasImageExtension(url: string): boolean {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url.split(/[?#]/)[0];
  }
  return IMAGE_EXTENSION_PATTERN.test(pathname);
}

function cleanList(values: unknown[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''))
    .filter((value) => value.length > 0);
}

function buildEcommerce({
  runOcr,
  name,
  brand,
  color,
  size,
}: {
  runOcr: string | null | undefined;
  name: string | undefined;
  brand: string | undefined;
  color: string | undefined;
  size: string | undefined;
}): Record<string, unknown> | undefined {
  const product: Record<string, string> = {};
  if (name) product['name'] = name;
  if (brand) product['brand'] = brand;
  if (color) product['color'] = color;
  if (size) product['size'] = size;
  const ecommerce: Record<string, unknown> = {};
  if (runOcr === 'yes') ecommerce['run_ocr'] = true;
  if (runOcr === 'no') ecommerce['run_ocr'] = false;
  if (Object.keys(product).length > 0) ecommerce['product'] = product;
  return Object.keys(ecommerce).length > 0 ? ecommerce : undefined;
}

type GenerateResponse = {
  asset_id: string;
  alt_text?: string | string[];
  created_at?: string;
  [key: string]: unknown;
};
