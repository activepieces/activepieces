import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { BULLET_PRESETS, PARAGRAPH_ALIGNMENTS, slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { updateParagraphStyleOutputSchema } from '../output-schemas';

export const updateParagraphStyle = createAction({
  auth: googleSlidesAuth,
  name: 'update_paragraph_style',
  classification: 'WRITE',
  displayName: 'Update Paragraph Style',
  description: 'Set alignment, line spacing, paragraph spacing and bullets in a shape or table cell.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Format the paragraphs of one shape, text box, placeholder or table cell: horizontal alignment, line spacing (percent, 100 = single), space above/below in pt, and bullets or numbering (Bullets = NONE removes them). Applies to every paragraph touched by all the text, by Match Text or by a Start/End Index range. Use Update Text Style for bold, font, size and colour; use Update Shape Properties for vertical alignment. The element must already have text. Idempotent.',
    idempotent: true,
  },
  outputSchema: updateParagraphStyleOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.textElementIdProp(),
    row: slidesProps.cellRowProp(),
    column: slidesProps.cellColumnProp(),
    ...slidesProps.textRangeProps(),
    alignment: slidesProps.enumProp({
      displayName: 'Alignment',
      description: 'START (left in left-to-right text), CENTER, END or JUSTIFIED.',
      values: PARAGRAPH_ALIGNMENTS,
    }),
    line_spacing: Property.Number({
      displayName: 'Line Spacing (%)',
      description: 'Line spacing as a percentage of normal: 100 = single, 150 = one and a half.',
      required: false,
    }),
    space_above: Property.Number({ displayName: 'Space Above (pt)', description: 'Space before each paragraph, in points.', required: false }),
    space_below: Property.Number({ displayName: 'Space Below (pt)', description: 'Space after each paragraph, in points.', required: false }),
    bullets: slidesProps.enumProp({
      displayName: 'Bullets',
      description: 'Bullet or numbering preset for the paragraphs, or NONE to remove bullets.',
      values: BULLET_PRESETS,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Element Object ID' });
    const input = {
      alignment: slidesElements.readEnum({ value: propsValue.alignment, label: 'Alignment', allowed: PARAGRAPH_ALIGNMENTS }),
      lineSpacing: slidesElements.readPositive({ value: propsValue.line_spacing, label: 'Line Spacing (%)' }),
      spaceAbovePt: readNonNegative({ value: propsValue.space_above, label: 'Space Above (pt)' }),
      spaceBelowPt: readNonNegative({ value: propsValue.space_below, label: 'Space Below (pt)' }),
      bullets: slidesElements.readEnum({ value: propsValue.bullets, label: 'Bullets', allowed: BULLET_PRESETS }),
    };
    if (Object.values(input).every((value) => value === undefined)) {
      throw new Error('Set at least one of Alignment, Line Spacing, Space Above, Space Below or Bullets.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'update the paragraph style';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    const target = slidesElements.resolveTextTarget({ located, row: propsValue.row, column: propsValue.column });
    const ranges = slidesElements.resolveTextRanges({
      target,
      matchText: propsValue.match_text,
      startIndex: propsValue.start_index,
      endIndex: propsValue.end_index,
    });
    const requests = slidesElementRequests.buildParagraphRequests({ target, ranges, input });
    await slidesElements.applyRequests({ accessToken, presentationId, requests, revisionId: located.revisionId, action });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      objectId,
      rangesStyled: ranges.length,
      alignment: input.alignment ?? null,
      bullets: input.bullets ?? null,
    };
  },
});

function readNonNegative({ value, label }: { value: unknown; label: string }): number | undefined {
  const number = slidesRequests.toNumber({ value, label });
  if (number !== undefined && number < 0) {
    throw new Error(`${label} cannot be negative, got ${number}.`);
  }
  return number;
}
