import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { insertImageOutputSchema } from '../output-schemas';

export const insertImage = createAction({
  auth: googleSlidesAuth,
  name: 'insert_image',
  classification: 'WRITE',
  displayName: 'Insert Image',
  description: 'Add an image from a URL to a slide.',
  audience: 'both',
  aiMetadata: {
    description:
      'Place an image from a public URL on one slide (by number or object ID), optionally at an X/Y position and Width/Height in points (a standard 16:9 slide is 720 x 405 pt; the aspect ratio is kept). Use it to add a picture to a slide; to swap {{placeholder}} boxes for images use Replace Shapes with Image. The URL must be public, PNG/JPEG/GIF, under 50 MB. Not idempotent: each call adds another image.',
    idempotent: false,
  },
  outputSchema: insertImageOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public link to a PNG, JPEG or GIF image (under 50 MB), e.g. https://example.com/chart.png.',
      required: true,
    }),
    x: Property.Number({
      displayName: 'X (pt)',
      description: 'Distance from the left edge of the slide, in points. Set together with Y.',
      required: false,
    }),
    y: Property.Number({
      displayName: 'Y (pt)',
      description: 'Distance from the top edge of the slide, in points. Set together with X.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (pt)',
      description: "Width of the image box, in points. Set together with Height. Leave both empty for the image's own size.",
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (pt)',
      description: 'Height of the image box, in points. Set together with Width.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const url = slidesIds.validateImageUrl(context.propsValue.image_url);
    const { x, y, width, height } = context.propsValue;
    const geometry = slidesRequests.readImageGeometry({ x, y, width, height });
    const imageObjectId = slidesIds.generateObjectId('image');
    const accessToken = await getAccessToken(context.auth);
    const action = 'insert the image';
    const { objectId: slideObjectId, revisionId } = await slidesRequests
      .lookupSlide({ accessToken, presentationId, selector })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    await slidesApi
      .batchUpdate({
        accessToken,
        presentationId,
        requests: [slidesRequests.buildCreateImageRequest({ objectId: imageObjectId, slideObjectId, url, geometry })],
        requiredRevisionId: revisionId,
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    return { presentationId, slideObjectId, imageObjectId };
  },
});
