import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, pastebinCommon } from '../common';
import { pastebinAuth } from '../..';

export default createAction({
  auth: pastebinAuth,
  name: 'get_paste_content',
  displayName: 'Get Paste Content',
  description: 'Retrieves the content of a paste',
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
