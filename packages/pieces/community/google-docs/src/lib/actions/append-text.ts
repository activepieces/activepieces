import { docsCommon } from '../common';
import { googleDocsAuth, getAccessToken } from '../auth';
import { Property, createAction } from "@activepieces/pieces-framework";

export const appendText = createAction({
    auth: googleDocsAuth,
    name: 'append_text',
    description: 'Appends text to google docs',
    audience: 'both',
    aiMetadata: {
      description:
        'Appends text to the end of an existing Google Docs document identified by its ID. Use when an agent needs to add content to a known document without altering its existing text. Requires the document ID; not idempotent, since each call inserts the text again, accumulating duplicates.',
      idempotent: false,
    },
    displayName: 'Append text to google docs',
    props: {
      text: Property.LongText({
        displayName: 'Text to append',
        description: 'The text to append to the document',
        required: true,
      }),
      documentId: Property.ShortText({
        displayName: 'Document ID',
        description: 'The ID of the document to append text to',
        required: true,
      })
    },
    async run(context) {
      return await docsCommon.writeToDocument(
        context.propsValue.documentId,
        context.propsValue.text,
        await getAccessToken(context.auth)
      );
    },
  });
