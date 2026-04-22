import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { flattenDoc } from '../common';
import { documentIdProp } from '../common/props';

export const appendText = createAction({
  auth: googleDocsAuth,
  name: 'append_text',
  description: 'Append text to the end of an existing Google Doc.',
  displayName: 'Append Text',
  props: {
    documentId: documentIdProp('Document', 'The Google Doc to append text to.'),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to append to the document.',
      required: true,
    }),
    addNewLine: Property.Checkbox({
      displayName: 'Start on a new line',
      description: 'Insert a newline before the text so it starts on a new paragraph.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { documentId, text, addNewLine } = context.propsValue;
    const content = addNewLine ? `\n${text}` : text;

    const authClient = await createGoogleClient(context.auth);
    const docs = google.docs({ version: 'v1', auth: authClient });

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: content,
              endOfSegmentLocation: {},
            },
          },
        ],
      },
    });

    const finalDoc = await docs.documents.get({ documentId });
    return flattenDoc(finalDoc.data);
  },
});
