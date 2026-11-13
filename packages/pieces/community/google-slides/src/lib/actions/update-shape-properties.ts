import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { CONTENT_ALIGNMENTS, DASH_STYLES, slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { updateShapePropertiesOutputSchema } from '../output-schemas';

export const updateShapeProperties = createAction({
  auth: googleSlidesAuth,
  name: 'update_shape_properties',
  classification: 'WRITE',
  displayName: 'Update Shape Properties',
  description: 'Change the fill, outline and vertical text alignment of a shape or text box.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change how one shape or text box looks: fill colour (or "transparent"), outline colour (or "none"), outline weight in pt and dash style, and vertical alignment of its text (TOP, MIDDLE, BOTTOM). Only the properties you set change. Use Update Text Style for the text itself and Move or Resize Element for position and size; it does not work on images, tables or groups. The objectId comes from List Slide Elements or Create Shape. Idempotent.',
    idempotent: true,
  },
  outputSchema: updateShapePropertiesOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.elementIdProp({
      displayName: 'Shape Object ID',
      description: 'Object ID of the shape or text box (from List Slide Elements, Get Presentation Outline or Create Shape).',
    }),
    fill_color: slidesProps.colorProp({ displayName: 'Fill Color', description: 'Hex colour, e.g. #E8F0FE, or "transparent".' }),
    outline_color: slidesProps.colorProp({ displayName: 'Outline Color', description: 'Hex colour, e.g. #1A73E8, or "none" to hide the outline.' }),
    outline_weight: Property.Number({ displayName: 'Outline Weight (pt)', description: 'Outline thickness in points.', required: false }),
    outline_dash: slidesProps.enumProp({ displayName: 'Outline Dash', description: 'Outline dash style.', values: DASH_STYLES }),
    content_alignment: slidesProps.enumProp({
      displayName: 'Vertical Alignment',
      description: 'Where the text sits inside the shape.',
      values: CONTENT_ALIGNMENTS,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Shape Object ID' });
    const { shapeProperties, fields } = slidesElementRequests.buildShapeProperties({
      fillColor: slidesElements.readColor({ value: propsValue.fill_color, label: 'Fill Color' }),
      outlineColor: slidesElements.readColor({ value: propsValue.outline_color, label: 'Outline Color' }),
      outlineWeightPt: slidesElements.readPositive({ value: propsValue.outline_weight, label: 'Outline Weight (pt)' }),
      outlineDash: slidesElements.readEnum({ value: propsValue.outline_dash, label: 'Outline Dash', allowed: DASH_STYLES }),
      contentAlignment: slidesElements.readEnum({
        value: propsValue.content_alignment,
        label: 'Vertical Alignment',
        allowed: CONTENT_ALIGNMENTS,
      }),
    });
    if (fields.length === 0) {
      throw new Error('Set at least one of Fill Color, Outline Color, Outline Weight, Outline Dash or Vertical Alignment.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'update the shape';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    slidesElements.requireType({ located, types: ['SHAPE'], purpose: 'this action only changes shapes and text boxes' });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: [{ updateShapeProperties: { objectId, shapeProperties, fields: fields.join(',') } }],
      revisionId: located.revisionId,
      action,
    });
    return { presentationId, slideObjectId: located.slideObjectId, objectId, updatedFields: fields };
  },
});
