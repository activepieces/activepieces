import { Property, createAction } from '@ensemble/pieces-framework';
import { formatDate, makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';
import CryptoJS from 'crypto-js';

export default createAction({
  auth: pastefyAuth,
  name: 'edit_paste',
  displayName: 'Edit Paste',
  description: 'Edits an existing private paste',
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Encryption Password',
      description: 'Encrypts the paste with this password',
      required: false,
    }),
    folder_id: pastefyCommon.folder_id(false),
    visibility: pastefyCommon.visibility(false),
    expiry: Property.DateTime({
      displayName: 'Expiry Date',
      required: false,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const password = context.propsValue.password;
    let content = context.propsValue.content;
    let title = context.propsValue.title;
    if (password) {
      if (content) {
        content = CryptoJS.AES.encrypt(content, password).toString();
      }
      if (title) {
        title = CryptoJS.AES.encrypt(title, password).toString();
      }
    }
    const res = await client.editPaste(context.propsValue.paste_id, {
      title,
      content,
      encrypted: !!password,
      folder: context.propsValue.folder_id,
      visibility: context.propsValue.visibility,
      expire_at: formatDate(context.propsValue.expiry),
    });
    return res;
  },
});
