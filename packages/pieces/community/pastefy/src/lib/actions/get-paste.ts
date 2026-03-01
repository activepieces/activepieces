import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { pastefyAuth } from '../..';
import CryptoJS from 'crypto-js';

export default createAction({
  auth: pastefyAuth,
  name: 'get_paste',
  displayName: 'Get Paste',
  description: 'Retrieves a paste',
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Encryption Password',
      description: 'Decrypts the paste with this password',
      required: false,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const password = context.propsValue.password;
    const paste = await client.getPaste(context.propsValue.paste_id);
    if (paste.encrypted && password) {
      paste.content = CryptoJS.AES.decrypt(paste.content, password).toString(
        CryptoJS.enc.Utf8
      );
      if (paste.title) {
        paste.title = CryptoJS.AES.decrypt(paste.title, password).toString(
          CryptoJS.enc.Utf8
        );
      }
    }
    return paste;
  },
});
