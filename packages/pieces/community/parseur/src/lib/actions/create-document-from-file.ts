import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';

export const createDocumentFromFile = createAction({
  auth: parseurAuth,
  name: 'createDocumentFromFile',
  displayName: 'Create Document from File',
  description: 'Creates new document in mailbox from file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file (e.g. PDF, image, attachment) into a specified Parseur parser/mailbox as a new document for parsing. Use when the source is a binary file rather than email content. Requires the target parser ID and the file; each upload creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parserDropdown({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'Select the file to upload',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue: { parserId, file } }) {
    if (!parserId) {
      throw new Error('Parser is required');
    }
    return await parseurCommon.createDocumentFromFile({
      apiKey: apiKey.secret_text,
      parserId,
      file,
    });
  },
});
