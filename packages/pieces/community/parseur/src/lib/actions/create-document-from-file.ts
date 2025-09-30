import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';

export const createDocumentFromFile = createAction({
  auth: parseurAuth,
  name: 'createDocumentFromFile',
  displayName: 'Create Document from File',
  description: 'Creates new document in mailbox from file.',
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
      apiKey,
      parserId,
      file,
    });
  },
});
