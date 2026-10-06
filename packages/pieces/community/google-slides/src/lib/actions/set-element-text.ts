import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { setElementTextOutputSchema } from '../output-schemas';

export const setElementText = createAction({
  auth: googleSlidesAuth,
  name: 'set_element_text',
  classification: 'WRITE',
  displayName: 'Set Element Text',
  description: 'Replace all text in a shape, text box, placeholder or table cell.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the whole text of one shape, text box, placeholder (e.g. a slide title) or table cell (set Row and Column) with new text, or empty it with Clear Text. Pick it to rewrite one element; use Insert Text to add to existing text and Replace Text to swap a phrase everywhere. Character styling of the old text is not kept: re-apply with Update Text Style. The objectId comes from List Slide Elements or Get Presentation Outline. Idempotent: sends nothing when the text already matches.',
    idempotent: true,
  },
  outputSchema: setElementTextOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_id: slidesProps.textElementIdProp(),
    row: slidesProps.cellRowProp(),
    column: slidesProps.cellColumnProp(),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The new text. Use \\n for a new paragraph. Leave empty only together with Clear Text.',
      required: false,
    }),
    clear_text: Property.Checkbox({
      displayName: 'Clear Text',
      description: 'Turn on to remove all text from the element. Leave Text empty when using this.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const objectId = slidesElements.readElementId({ value: propsValue.object_id, label: 'Element Object ID' });
    const text = slidesElements.readText(propsValue.text) ?? '';
    const clear = slidesElements.readBoolean({ value: propsValue.clear_text, label: 'Clear Text' }) ?? false;
    if (clear && text !== '') {
      throw new Error('Clear Text is on but Text is set. Turn Clear Text off to set new text, or leave Text empty to clear it.');
    }
    if (!clear && text === '') {
      throw new Error('Text is empty. Enter the new text, or turn on Clear Text to remove the text.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'set the element text';
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId, action });
    const target = slidesElements.resolveTextTarget({ located, row: propsValue.row, column: propsValue.column });
    const requests = slidesElementRequests.buildSetTextRequests({ target, text });
    await slidesElements.applyRequests({ accessToken, presentationId, requests, revisionId: located.revisionId, action });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      objectId,
      row: target.cellLocation ? target.cellLocation.rowIndex + 1 : null,
      column: target.cellLocation ? target.cellLocation.columnIndex + 1 : null,
      text,
      changed: requests.length > 0,
    };
  },
});
