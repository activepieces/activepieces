import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { updateTextStyleOutputSchema } from '../output-schemas';

export const updateTextStyle = createAction({
  auth: googleSlidesAuth,
  name: 'update_text_style',
  classification: 'WRITE',
  displayName: 'Update Text Style',
  description: 'Change bold, italic, font, size, colour or link of text in a shape or table cell.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change character formatting (bold, italic, underline, strikethrough, font family, font size in pt, text colour, highlight, link) of the text in one shape, text box, placeholder or table cell, in one call. Applies to all its text, to every occurrence of Match Text, or to a Start/End Index range; only the styles you set change. Use Update Paragraph Style for alignment, spacing and bullets. The element must already have text; its objectId comes from List Slide Elements or Create Shape. Idempotent.',
    idempotent: true,
  },
  outputSchema: updateTextStyleOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.textElementIdProp(),
    row: slidesProps.cellRowProp(),
    column: slidesProps.cellColumnProp(),
    ...slidesProps.textRangeProps(),
    bold: Property.Checkbox({ displayName: 'Bold', description: 'true or false; leave unset to keep.', required: false }),
    italic: Property.Checkbox({ displayName: 'Italic', description: 'true or false; leave unset to keep.', required: false }),
    underline: Property.Checkbox({ displayName: 'Underline', description: 'true or false; leave unset to keep.', required: false }),
    strikethrough: Property.Checkbox({
      displayName: 'Strikethrough',
      description: 'true or false; leave unset to keep.',
      required: false,
    }),
    font_family: Property.ShortText({
      displayName: 'Font Family',
      description: 'Google Fonts family name, e.g. "Roboto" or "Montserrat".',
      required: false,
    }),
    font_size: Property.Number({ displayName: 'Font Size (pt)', description: 'Font size in points, e.g. 24.', required: false }),
    text_color: slidesProps.colorProp({ displayName: 'Text Color', description: 'Hex colour, e.g. #202124.' }),
    highlight_color: slidesProps.colorProp({
      displayName: 'Highlight Color',
      description: 'Hex background colour behind the text, or "none" to remove the highlight.',
    }),
    link_url: Property.ShortText({
      displayName: 'Link URL',
      description: 'Make the text a link to this http(s) URL, or "none" to remove an existing link.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Element Object ID' });
    const textColor = slidesElements.readColor({ value: propsValue.text_color, label: 'Text Color' });
    if (textColor?.kind === 'none') {
      throw new Error('Text Color must be a hex colour like #202124; "none" is only allowed for Highlight Color.');
    }
    const fontSizePt = slidesElements.readPositive({ value: propsValue.font_size, label: 'Font Size (pt)' });
    const fontFamily = propsValue.font_family?.trim() || undefined;
    const { style, fields } = slidesElementRequests.buildTextStyle({
      bold: slidesElements.readBoolean({ value: propsValue.bold, label: 'Bold' }),
      italic: slidesElements.readBoolean({ value: propsValue.italic, label: 'Italic' }),
      underline: slidesElements.readBoolean({ value: propsValue.underline, label: 'Underline' }),
      strikethrough: slidesElements.readBoolean({ value: propsValue.strikethrough, label: 'Strikethrough' }),
      fontFamily,
      fontSizePt,
      textColor,
      highlightColor: slidesElements.readColor({ value: propsValue.highlight_color, label: 'Highlight Color' }),
      link: readLink(propsValue.link_url),
    });
    const accessToken = await getAccessToken(context.auth);
    const action = 'update the text style';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    const target = slidesElements.resolveTextTarget({ located, row: propsValue.row, column: propsValue.column });
    const ranges = slidesElements.resolveTextRanges({
      target,
      matchText: propsValue.match_text,
      startIndex: propsValue.start_index,
      endIndex: propsValue.end_index,
    });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: slidesElementRequests.buildTextStyleRequests({ target, ranges, style, fields }),
      revisionId: located.revisionId,
      action,
    });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      objectId,
      rangesStyled: ranges.length,
      updatedFields: fields,
    };
  },
});

function readLink(value: unknown): string | null | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    return undefined;
  }
  if (text.toLowerCase() === 'none') {
    return null;
  }
  if (!/^https?:\/\/\S+$/i.test(text)) {
    throw new Error(`Link URL must start with http:// or https://, got "${text}".`);
  }
  return text;
}
