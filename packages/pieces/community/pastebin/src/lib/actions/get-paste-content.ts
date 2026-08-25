import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, pastebinCommon } from '../common';
import { pastebinAuth } from '../..';

export default createAction({
  auth: pastebinAuth,
  name: 'get_paste_content',
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
    const client = await makeClient(context.auth);
    const content = await client.getPasteContent(context.propsValue.paste_id);
    return {
      content,
    };
  },
});
