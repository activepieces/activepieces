import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { IMAGE_REPLACE_METHODS, slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { replaceImageOutputSchema } from '../output-schemas';

export const replaceImage = createAction({
  auth: googleSlidesAuth,
  name: 'replace_image',
  classification: 'WRITE',
  displayName: 'Replace Image',
  description: 'Swap an existing image for a new one from a URL, keeping its position and size.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace one existing image (by its object ID) with a new image from a public URL; the frame keeps its position and size, and the new picture is fitted (CENTER_INSIDE, default) or cropped to fill (CENTER_CROP). Use it to refresh a logo, chart picture or photo; use Insert Image to add a new image and Replace Shapes with Image to swap {{tag}} text boxes. The image objectId comes from List Slide Elements (type IMAGE). Idempotent.',
    idempotent: true,
  },
  outputSchema: replaceImageOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    image_object_id: slidesProps.elementIdProp({
      displayName: 'Image Object ID',
      description: 'Object ID of the image to replace (type IMAGE in List Slide Elements, or from Insert Image).',
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public link to a PNG, JPEG or GIF image (under 50 MB).',
      required: true,
    }),
    replace_method: slidesProps.enumProp({
      displayName: 'Fit',
      description: 'CENTER_INSIDE (default) fits the whole image in the frame; CENTER_CROP fills the frame and crops.',
      values: IMAGE_REPLACE_METHODS,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const imageObjectId = slidesElements.readElementId({ value: propsValue.image_object_id, label: 'Image Object ID' });
    const url = slidesIds.validateImageUrl(propsValue.image_url);
    const method =
      slidesElements.readEnum({ value: propsValue.replace_method, label: 'Fit', allowed: IMAGE_REPLACE_METHODS }) ?? 'CENTER_INSIDE';
    const accessToken = await getAccessToken(context.auth);
    const action = 'replace the image';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId: imageObjectId, action });
    slidesElements.requireType({ located, types: ['IMAGE'], purpose: 'this action only replaces images' });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: [slidesElementRequests.buildReplaceImageRequest({ imageObjectId, url, method })],
      revisionId: located.revisionId,
      action,
    });
    return { presentationId, slideObjectId: located.slideObjectId, imageObjectId, imageUrl: url, fit: method };
  },
});
