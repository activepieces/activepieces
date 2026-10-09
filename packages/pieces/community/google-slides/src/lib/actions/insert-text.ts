import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { insertTextOutputSchema } from '../output-schemas';

export const insertText = createAction({
  auth: googleSlidesAuth,
  name: 'insert_text',
  classification: 'WRITE',
  displayName: 'Insert Text',
  description: 'Insert text into a shape, text box or table cell (appends by default).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Insert text into one shape, text box, placeholder or table cell (set Row and Column for a cell), at the end by default or at a 0-based character index. Use it to add to existing text; to replace the whole text use Set Element Text, and to change words across the deck use Replace Text. The element objectId comes from List Slide Elements, Get Presentation Outline or Create Shape. Not idempotent: each call inserts the text again.',
    idempotent: false,
  },
  outputSchema: insertTextOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.textElementIdProp(),
    row: slidesProps.cellRowProp(),
    column: slidesProps.cellColumnProp(),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to insert. Start it with \\n to begin a new paragraph after the existing text.',
      required: true,
    }),
    insertion_index: Property.Number({
      displayName: 'Insertion Index',
      description: 'Optional 0-based character position (0 = start). Leave empty to append at the end.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Element Object ID' });
    const text = slidesElements.readText(propsValue.text) ?? '';
    const insertionIndex = slidesRequests.toInteger({ value: propsValue.insertion_index, label: 'Insertion Index' });
    if (text === '') {
      throw new Error('Text is empty. Give the text to insert.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'insert the text';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    const target = slidesElements.resolveTextTarget({ located, row: propsValue.row, column: propsValue.column });
    const { request, insertedAt, newText } = slidesElementRequests.buildInsertTextRequest({ target, text, insertionIndex });
    await slidesElements.applyRequests({ accessToken, presentationId, requests: [request], revisionId: located.revisionId, action });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      objectId,
      row: target.cellLocation ? target.cellLocation.rowIndex + 1 : null,
      column: target.cellLocation ? target.cellLocation.columnIndex + 1 : null,
      insertedAt,
      text: newText,
    };
  },
});
