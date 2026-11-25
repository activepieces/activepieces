import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequest, nonEmptyStrings, normalizeImage, stripDataUriPrefix } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

const ALT_TEXT_MACRO = '{{AltText}}';
const MAX_GPT_PROMPT_LENGTH = 768;
const PLACEHOLDER_PATTERN = /\[alttext\]/i;
const PLACEHOLDER_PATTERN_GLOBAL = /\[alttext\]/gi;
const EXISTING_IMAGE_NOTE =
  'An image with this URL already existed, so AltText.ai returned its stored alt text (no credit spent; your asset ID, keywords and prompt were not applied). Set Overwrite Existing to Yes to regenerate.';
const REUSED_IMAGE_AGE_MS = 60_000;

export const generateAltTextAction = createAction({
  name: 'generate-alt-text',
  classification: 'WRITE',
  auth: altTextAiAuth,
  displayName: 'Generate Alt Text',
  description: 'Generates descriptive alt text for an image from a URL or an uploaded file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an image (public image URL, or an uploaded file) to AltText.ai and returns AI-generated alt text for accessibility and SEO, plus the asset ID of the stored image. Spends credits only when a new image is described (one credit per language) or when Overwrite Existing is Yes; an image URL already in the library returns its stored alt text at no cost, and then the note output explains that the asset ID, keywords and prompt were not applied. Optionally choose languages, bias the text with keywords, negative keywords, a keyword-source text, plain-English rewrite instructions (Custom Prompt), or e-commerce product/brand names. To read alt text that already exists, use Get Image or List Images instead. Not idempotent.',
    idempotent: false,
  },
  outputSchema: altTextAiOutputSchemas.generatedImage,
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image. Provide either this or Image, not both.',
      required: false,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'Image file to describe. Provide either this or Image URL, not both.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Languages',
      description:
        'Each extra language costs 1 credit. Comma-separated codes, e.g. en,fr. Empty = account default.',
      required: false,
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      required: false,
      description: 'Keywords or phrases to consider when generating the alt text.',
    }),
    negativeKeywords: Property.Array({
      displayName: 'Negative Keywords',
      required: false,
      description: 'Keywords or phrases to remove from any generated alt text.',
    }),
    keywordSource: Property.LongText({
      displayName: 'Keyword Source',
      required: false,
      description: 'Text to use as the source of keywords for the alt text.',
    }),
    gptPrompt: Property.LongText({
      displayName: 'Custom Prompt',
      required: false,
      description:
        'Rewrite instructions; optional [AltText] marks where the text goes. E.g. "Under 80 characters". Without [AltText], the generated text is added after your instructions. Write in English, at most about 750 characters.',
    }),
    ecommProduct: Property.ShortText({
      displayName: 'Product Name',
      required: false,
      description: 'E-commerce product name to include in the alt text.',
    }),
    ecommBrand: Property.ShortText({
      displayName: 'Brand Name',
      required: false,
      description: 'E-commerce brand name to include in the alt text.',
    }),
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      required: false,
      description: 'Your own identifier to store the image under. Leave empty to let AltText.ai assign one. If an image with this URL already exists and Overwrite Existing is not Yes, the existing image (with its own asset ID) is returned instead.',
    }),
    overwrite: Property.StaticDropdown<string>({
      displayName: 'Overwrite Existing',
      required: false,
      description: 'Whether to regenerate alt text if an image with this URL already exists. If not Yes, AltText.ai returns the stored alt text of the existing image (no credit spent) and ignores your asset ID, keywords and prompt.',
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const body = buildGenerateBody(context.propsValue);
    const requestStartedAt = Date.now();
    const response = await altTextAiRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/images',
      operation: 'Generate Alt Text',
      body,
    });
    const image = normalizeImage(response);
    const requestedAssetId = context.propsValue.assetId?.trim();
    const idDiffers = Boolean(requestedAssetId) && image.asset_id !== null && image.asset_id !== requestedAssetId;
    const createdBeforeRequest =
      image.created_at !== null && image.created_at * 1000 < requestStartedAt - REUSED_IMAGE_AGE_MS;
    const note = idDiffers || createdBeforeRequest ? EXISTING_IMAGE_NOTE : null;
    return { ...image, note };
  },
});

function buildGenerateBody(props: GenerateProps): Record<string, unknown> {
  const imageUrl = props.imageUrl?.trim();
  const file = props.image;
  const hasFile = isFileLike(file);
  if (imageUrl && hasFile) {
    throw new Error('Provide either Image URL or Image, not both.');
  }
  if (!imageUrl && !hasFile) {
    throw new Error('Provide an Image URL or an Image file.');
  }
  const body: Record<string, unknown> = {};
  const assetId = props.assetId?.trim();
  const imageBody: Record<string, string> = {};
  if (assetId) imageBody['asset_id'] = assetId;
  if (imageUrl) {
    imageBody['url'] = imageUrl;
  } else if (isFileLike(file)) {
    imageBody['raw'] = stripDataUriPrefix(file.base64);
  }
  body['image'] = imageBody;
  const lang = props.lang
    ?.split(',')
    .map((code) => code.trim())
    .filter((code) => code !== '')
    .join(',');
  if (lang) body['lang'] = lang;
  const keywords = nonEmptyStrings(props.keywords);
  if (keywords.length > 0) body['keywords'] = keywords;
  const negativeKeywords = nonEmptyStrings(props.negativeKeywords);
  if (negativeKeywords.length > 0) body['negative_keywords'] = negativeKeywords;
  const keywordSource = props.keywordSource?.trim();
  if (keywordSource) body['keyword_source'] = keywordSource;
  const gptPrompt = props.gptPrompt?.trim();
  if (gptPrompt) {
    const finalPrompt = PLACEHOLDER_PATTERN.test(gptPrompt)
      ? gptPrompt.replace(PLACEHOLDER_PATTERN_GLOBAL, ALT_TEXT_MACRO)
      : `${gptPrompt}\n\nAlt text: ${ALT_TEXT_MACRO}`;
    if (finalPrompt.length > MAX_GPT_PROMPT_LENGTH) {
      throw new Error(
        `Custom Prompt is too long: AltText.ai accepts at most ${MAX_GPT_PROMPT_LENGTH} characters including the generated alt text reference (this prompt needs ${finalPrompt.length}). Shorten it.`,
      );
    }
    body['gpt_prompt'] = finalPrompt;
  }
  if (props.overwrite === 'yes') body['overwrite'] = true;
  if (props.overwrite === 'no') body['overwrite'] = false;
  const product = props.ecommProduct?.trim();
  const brand = props.ecommBrand?.trim();
  if (product || brand) {
    const ecomm: Record<string, string> = {};
    if (product) ecomm['product'] = product;
    if (brand) ecomm['brand'] = brand;
    body['ecomm'] = ecomm;
  }
  return body;
}

function isFileLike(value: unknown): value is FileLike {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'base64' in value &&
    typeof value.base64 === 'string' &&
    value.base64.length > 0 &&
    'filename' in value &&
    typeof value.filename === 'string'
  );
}

type FileLike = { base64: string; filename: string; extension?: string };

type GenerateProps = {
  imageUrl?: string;
  image?: unknown;
  lang?: string;
  keywords?: unknown[];
  negativeKeywords?: unknown[];
  keywordSource?: string;
  gptPrompt?: string;
  ecommProduct?: string;
  ecommBrand?: string;
  assetId?: string;
  overwrite?: string;
};

export { buildGenerateBody };
