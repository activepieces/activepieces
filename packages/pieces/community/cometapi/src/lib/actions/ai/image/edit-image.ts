import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiEditImageOutputSchema } from '../../../output-schemas';

export const editImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_edit_image',
  outputSchema: cometapiEditImageOutputSchema,
  displayName: 'Edit Image',
  description:
    'Edits existing images from a text instruction with GPT Image, Grok or SeedEdit models.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Edits one or more source images from a text instruction and returns the edited images in data[] (b64_json or url). Give exactly one of Image File (multipart, for GPT Image models such as gpt-image-2) or Image URLs (JSON, for Grok models with one to three URLs and SeedEdit with one); masks go in Mask File or Mask URL to match. Use Generate Image to start from text only. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Image editing model ID, e.g. "gpt-image-2", "grok-imagine-image-quality" or "doubao-seededit-3-0-i2i-250628". Use List Models with feature image-editing.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Instruction describing the edit.',
      required: true,
    }),
    imageFile: Property.File({
      displayName: 'Image File',
      description:
        'Source image (PNG or JPG) uploaded as multipart, for GPT Image models. Give this or Image URLs, not both.',
      required: false,
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description:
        'Public HTTPS URLs or data URIs of the source images, sent as JSON. Grok models take one to three; SeedEdit takes one. Give this or Image File, not both.',
      required: false,
    }),
    maskFile: Property.File({
      displayName: 'Mask File',
      description:
        'PNG mask for Image File; transparent areas mark the region to edit and its size must match the source image.',
      required: false,
    }),
    maskUrl: Property.ShortText({
      displayName: 'Mask URL',
      description:
        'Mask as a public HTTPS URL or data URI, for SeedEdit with Image URLs.',
      required: false,
    }),
    n: cometApiAiProps.numberOfImages({
      required: false,
      description: 'How many edited images to return. Defaults to 1.',
    }),
    size: Property.ShortText({
      displayName: 'Size',
      description:
        'Output size supported by the model, e.g. "1024x1024" for GPT Image or "2K" for SeedEdit.',
      required: false,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'url or b64_json, for models that support it. GPT Image models always return b64_json.',
      required: false,
      options: {
        options: [
          { label: 'url', value: 'url' },
          { label: 'b64_json', value: 'b64_json' },
        ],
      },
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other body fields as a JSON object, e.g. quality and output_format (GPT Image), aspect_ratio and resolution (Grok), seed, guidance_scale and watermark (SeedEdit). Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    const { imageFile, imageUrls, maskFile, maskUrl } = propsValue;
    const hasUrls = imageUrls !== undefined && imageUrls.length > 0;
    if (Boolean(imageFile) === hasUrls) {
      throw new Error(
        'Give exactly one of Image File (GPT Image models) or Image URLs (Grok and SeedEdit models).'
      );
    }
    if (hasUrls) {
      if (maskFile) {
        throw new Error(
          'Mask File only works with Image File; use Mask URL with Image URLs.'
        );
      }
      return await cometApiClient.request({
        auth,
        method: HttpMethod.POST,
        path: '/images/edits',
        body: cometApiUtils.withAdditionalFields({
          additionalFields: propsValue.additionalFields,
          fields: {
            model: propsValue.model,
            prompt: propsValue.prompt,
            ...jsonImageFields({ model: propsValue.model, imageUrls }),
            mask: maskUrl,
            n: propsValue.n,
            size: propsValue.size,
            response_format: propsValue.responseFormat,
          },
        }),
      });
    }
    if (maskUrl) {
      throw new Error(
        'Mask URL only works with Image URLs; use Mask File with Image File.'
      );
    }
    const form = new FormData();
    const fields = cometApiUtils.withAdditionalFields({
      additionalFields: propsValue.additionalFields,
      fields: {
        model: propsValue.model,
        prompt: propsValue.prompt,
        n: propsValue.n?.toString(),
        size: propsValue.size,
        response_format: propsValue.responseFormat,
      },
    });
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        form.append(
          key,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      }
    }
    if (imageFile) {
      form.append('image', imageBlob({ file: imageFile }), imageFile.filename);
    }
    if (maskFile) {
      form.append('mask', imageBlob({ file: maskFile }), maskFile.filename);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/images/edits',
      body: form,
    });
  },
});

function imageBlob({ file }: { file: ApFile }): Blob {
  const extension = file.extension?.toLowerCase();
  const type =
    extension === 'jpg' ? 'image/jpeg' : extension ? `image/${extension}` : '';
  return new Blob([new Uint8Array(file.data)], { type });
}

function jsonImageFields({
  model,
  imageUrls,
}: {
  model: string;
  imageUrls: unknown[];
}) {
  if (model.startsWith('grok')) {
    return imageUrls.length === 1
      ? { image: { url: imageUrls[0] } }
      : { images: imageUrls.map((url) => ({ url })) };
  }
  if (imageUrls.length > 1) {
    throw new Error(
      'Image URLs takes one URL for non-Grok models such as SeedEdit; only Grok models accept two or three.'
    );
  }
  return { image: imageUrls[0] };
}
