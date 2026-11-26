import { createAction, Property } from '@activepieces/pieces-framework';
import { removeAcAuth } from '../common/auth';
import { removeAcTicket } from '../common/ticket';

export const removeBackground = createAction({
  auth: removeAcAuth,
  name: 'remove_background',
  displayName: 'Remove Background',
  description: 'Remove the background from an image using remove.ac',
  audience: 'both',
  aiMetadata: {
    description: 'Remove the background from one image and save the result as a file. Reuse the same idempotency key when retrying an identical request.',
    idempotent: false,
  },
  classification: 'WRITE',
  props: {
    image: Property.File({
      displayName: 'Image File',
      description: 'Image to process, up to 25 MB and 50 megapixels. Provide only one image source.',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image. Provide only one image source.',
      required: false,
    }),
    imageBase64: Property.LongText({
      displayName: 'Base64 Image',
      description: 'Raw Base64 or an image data URL. Provide only one image source.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'Reuse this key (up to 255 characters) to retry the same request without a duplicate charge.',
      required: false,
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'preview, small and regular cost 0.25 credit. auto and full cost 1 credit.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Preview (0.25 credit)', value: 'preview' },
          { label: 'Small (0.25 credit)', value: 'small' },
          { label: 'Regular (0.25 credit)', value: 'regular' },
          { label: 'Auto (1 credit)', value: 'auto' },
          { label: 'Full (1 credit)', value: 'full' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'png',
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'WebP', value: 'webp' },
          { label: 'ZIP', value: 'zip' },
        ],
      },
    }),
    bgColor: Property.ShortText({
      displayName: 'Background Color',
      description: 'Hex code (for example ffffff) or color name. Leave empty for transparent.',
      required: false,
    }),
    crop: Property.Checkbox({
      displayName: 'Crop to Subject',
      required: false,
      defaultValue: false,
    }),
    scale: Property.ShortText({
      displayName: 'Scale',
      description: 'Subject scale, for example 50% or original',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'Subject position, for example center or original',
      required: false,
    }),
  },
  async run(context) {
    const { image, size, format, bgColor, crop, scale, position } =
      context.propsValue;

    const imageUrl = context.propsValue.imageUrl?.trim();
    const imageBase64 = context.propsValue.imageBase64?.trim();
    const idempotencyKey = context.propsValue.idempotencyKey?.trim();
    if ([image, imageUrl, imageBase64].filter(Boolean).length !== 1) {
      throw new Error('Provide exactly one of Image File, Image URL, or Base64 Image.');
    }
    if (idempotencyKey && idempotencyKey.length > 255) {
      throw new Error('Idempotency Key must be 255 characters or fewer.');
    }

    const base64 = image?.base64 ?? imageBase64?.replace(/^data:image\/[^;,]+;base64,/i, '');
    const bytes = base64 ? Buffer.from(base64, 'base64') : undefined;
    if ((image || imageBase64) && !bytes?.length) {
      throw new Error('Provide a non-empty image.');
    }
    if (bytes && bytes.length > 25 * 1024 * 1024) {
      throw new Error('The image exceeds the remove.ac 25 MB upload limit.');
    }

    const options = {
      size: size ?? 'auto',
      format: format ?? 'png',
      bg_color: bgColor || undefined,
      crop,
      scale: scale || undefined,
      position: position || undefined,
    };
    const apiKey = context.auth.secret_text;
    const filename = image?.filename ?? 'image';
    const ticketUpload = bytes ? { apiKey, idempotencyKey, bytes, filename, options } : undefined;
    const inputSize = imageBase64 ? Buffer.byteLength(imageBase64) : bytes?.length ?? 0;

    let response: Response;
    if (ticketUpload && inputSize > 4_400_000) {
      response = await removeAcTicket.uploadWithTicket(ticketUpload);
    } else {
      const form = new FormData();
      if (image && bytes) {
        form.set('image_file', new Blob([bytes]), filename);
      } else if (imageUrl) {
        form.set('image_url', imageUrl);
      } else if (imageBase64) {
        form.set('image_file_b64', imageBase64);
      }
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) form.set(key, String(value));
      }

      response = await fetch('https://remove.ac/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        redirect: 'error',
        body: form,
      });
      if (response.status === 413 && ticketUpload) {
        await response.body?.cancel();
        response = await removeAcTicket.uploadWithTicket(ticketUpload);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`remove.ac error ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0].trim();
    const extension = Object.entries({
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      zip: 'application/zip',
    }).find(([, mime]) => mime === contentType)?.[0];
    if (!extension) {
      throw new Error('remove.ac returned an unexpected output format.');
    }
    const fileName = `removed-bg.${extension}`;
    const file = await context.files.write({
      fileName,
      data: Buffer.from(await response.arrayBuffer()),
    });

    return { fileName, file };
  },
});
