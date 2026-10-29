import { createAction } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { moveResizeElementOutputSchema } from '../output-schemas';

export const moveResizeElement = createAction({
  auth: googleSlidesAuth,
  name: 'move_resize_element',
  classification: 'WRITE',
  displayName: 'Move or Resize Element',
  description: 'Set the position and/or size of an element on a slide, in points.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move and/or resize one element (shape, text box, image, table, video, line or group) by setting X, Y, Width and/or Height in points; unset values stay as they are, and if only one of Width/Height is set the aspect ratio is kept. Get current positions and the slide size from List Slide Elements. Groups (x/y = the box around their elements), tables and rotated elements can only be moved, not resized; an element inside a group is moved through its group. Idempotent: the same values give the same result.',
    idempotent: true,
  },
  outputSchema: moveResizeElementOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.elementIdProp({
      displayName: 'Element Object ID',
      description: 'Object ID of the element to move or resize (from List Slide Elements or Get Presentation Outline).',
    }),
    x: slidesProps.pointProp({ displayName: 'X (pt)', description: 'New distance from the left edge of the slide, in points.', required: false }),
    y: slidesProps.pointProp({ displayName: 'Y (pt)', description: 'New distance from the top edge of the slide, in points.', required: false }),
    width: slidesProps.pointProp({ displayName: 'Width (pt)', description: 'New width in points.', required: false }),
    height: slidesProps.pointProp({ displayName: 'Height (pt)', description: 'New height in points.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Element Object ID' });
    const { x, y, width, height } = propsValue;
    if ([x, y, width, height].every((value) => value === undefined || value === null)) {
      throw new Error('Set at least one of X, Y, Width or Height (in points).');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'move or resize the element';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    const { transform, geometry } = slidesElements.computeMoveResize({ located, x, y, width, height });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: [{ updatePageElementTransform: { objectId, applyMode: 'ABSOLUTE', transform } }],
      revisionId: located.revisionId,
      action,
    });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      objectId,
      ...geometry,
    };
  },
});
