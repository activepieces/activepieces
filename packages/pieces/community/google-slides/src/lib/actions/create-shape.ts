import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { SHAPE_TYPES, slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { createShapeOutputSchema } from '../output-schemas';

export const createShape = createAction({
  auth: googleSlidesAuth,
  name: 'create_shape',
  classification: 'WRITE',
  displayName: 'Create Shape or Text Box',
  description: 'Add a text box or shape to a slide, optionally with text and a fill colour.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a text box (default) or another shape (rectangle, ellipse, arrow, callout…) to one slide at X/Y with Width/Height in points (a standard 16:9 slide is 720 x 405 pt; List Slide Elements gives the exact size and what is already there), optionally with its text and fill colour in the same call. Use it to put new text or boxes on a slide; to fill an existing placeholder use Set Element Text, and for pictures use Insert Image. Returns the new objectId for styling calls (Update Text Style, Update Shape Properties). Not idempotent: each call adds another shape.',
    idempotent: false,
  },
  outputSchema: createShapeOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    shape_type: slidesProps.enumProp({
      displayName: 'Shape Type',
      description: 'TEXT_BOX (default) has no fill or outline; the others are filled shapes.',
      values: SHAPE_TYPES,
    }),
    x: slidesProps.pointProp({ displayName: 'X (pt)', description: 'Distance from the left edge of the slide, in points.', required: true }),
    y: slidesProps.pointProp({ displayName: 'Y (pt)', description: 'Distance from the top edge of the slide, in points.', required: true }),
    width: slidesProps.pointProp({ displayName: 'Width (pt)', description: 'Width in points, greater than 0.', required: true }),
    height: slidesProps.pointProp({ displayName: 'Height (pt)', description: 'Height in points, greater than 0.', required: true }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Optional text to put in the shape. Use \\n for a new paragraph.',
      required: false,
    }),
    fill_color: slidesProps.colorProp({
      displayName: 'Fill Color',
      description: 'Optional hex colour for the background, e.g. #1A73E8, or "transparent".',
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: propsValue.slide_number,
      slideObjectId: propsValue.slide_object_id,
    });
    const shapeType =
      slidesElements.readEnum({ value: propsValue.shape_type, label: 'Shape Type', allowed: SHAPE_TYPES }) ?? 'TEXT_BOX';
    const box = slidesElements.readBox({ x: propsValue.x, y: propsValue.y, width: propsValue.width, height: propsValue.height, required: true });
    const text = slidesElements.readText(propsValue.text);
    const fillColor = slidesElements.readColor({ value: propsValue.fill_color, label: 'Fill Color' });
    const objectId = slidesIds.generateObjectId('shape');
    const accessToken = await getAccessToken(context.auth);
    const action = 'create the shape';
    const { objectId: slideObjectId, revisionId } = await slidesRequests
      .lookupSlide({ accessToken, presentationId, selector })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: slidesElementRequests.buildCreateShapeRequests({ objectId, slideObjectId, shapeType, box, text, fillColor }),
      revisionId,
      action,
    });
    return {
      presentationId,
      slideObjectId,
      objectId,
      shapeType,
      x: box.position?.x ?? null,
      y: box.position?.y ?? null,
      width: box.size?.width ?? null,
      height: box.size?.height ?? null,
      text: text ?? '',
    };
  },
});
