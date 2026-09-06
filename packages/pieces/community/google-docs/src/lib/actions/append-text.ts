import { docsCommon } from '../common';
import { googleDocsAuth, getAccessToken } from '../auth';
import { Property, createAction } from "@activepieces/pieces-framework";
import { documentIdProp } from '../common/props';
import { appendTextActionOutputSchema } from '../output-schemas';

export const appendText = createAction({
    auth: googleDocsAuth,
    name: 'append_text',
    classification: 'WRITE',
    description: 'Add text to the end of a document.',
    audience: 'human',
    aiMetadata: {
      description:
        'Appends text to the end of an existing Google Docs document identified by its ID. Use when an agent needs to add content to a known document without altering its existing text. Requires the document ID; not idempotent, since each call inserts the text again, accumulating duplicates.',
      idempotent: false,
    },
    displayName: 'Append Text',
    props: {
      documentId: documentIdProp(),
      text: Property.LongText({
        displayName: 'Text',
        description: 'Added to the end of the document.',
        required: true,
      }),
    },
    outputSchema: appendTextActionOutputSchema,
    async run(context) {
      return await docsCommon.writeToDocument(
        context.propsValue.documentId,
        context.propsValue.text,
        await getAccessToken(context.auth)
      );
    },
  });
