import { docsCommon } from '../common';
import { googleDocsAuth } from '../..';
import { Property, createAction } from "@activepieces/pieces-framework";

export const appendText = createAction({
    auth: googleDocsAuth,
    name: 'append_text',
    description: 'Appends text to google docs',
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
        context.auth.access_token
      );
    },
  });