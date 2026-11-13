import { Property, createAction } from '@activepieces/pieces-framework';
import { pastebinAuth } from '../auth';
import { pastebinApi } from '../common/api';
import { getPasteContentOutputSchema } from '../output-schemas';

export const getPasteContentAction = createAction({
  auth: pastebinAuth,
  name: 'get_paste_content',
  outputSchema: getPasteContentOutputSchema,
  classification: 'READ',
  displayName: 'Get Paste Content',
  description: 'Retrieves the content of a paste',
  audience: 'both',
  aiMetadata: { description: 'Fetches the raw text content of an existing Pastebin paste by its paste ID. Use to read back a snippet you have the ID for; private pastes require account credentials on the connection. Idempotent — a read-only lookup with no side effect.', idempotent: true },
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
  },
  async run(context) {
    const content = await pastebinApi.getPasteContent({
      auth: context.auth,
      pasteKey: context.propsValue.paste_id,
    });
    return {
      content,
    };
  },
});
