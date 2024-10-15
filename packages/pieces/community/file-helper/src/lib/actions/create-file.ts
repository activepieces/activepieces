import { createAction, Property } from '@activepieces/pieces-framework';

export const createFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createFile',
  displayName: 'Create file',
  description: 'Create file from content',
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
    fileName: Property.ShortText({ displayName: 'File name', required: true }),
    encoding: Property.StaticDropdown({
      displayName: 'Encoding',
      required: true,
      defaultValue: 'utf8',
      options: {
        // Checkout https://nodejs.org/api/buffer.html#buffers-and-character-encodings
        options: [
          {
            value: 'ascii',
            label: 'ASCII',
          },
          {
            value: 'utf8',
            label: 'UTF-8',
          },
          {
            value: 'utf16le',
            label: 'UTF-16LE',
          },
          {
            value: 'ucs2',
            label: 'UCS-2',
          },
          {
            value: 'base64',
            label: 'Base64',
          },
          {
            value: 'base64url',
            label: 'Base64 URL',
          },
          {
            value: 'latin1',
            label: 'Latin1',
          },
          {
            value: 'binary',
            label: 'Binary',
          },
          {
            value: 'hex',
            label: 'Hex',
          },
        ],
      },
    }),

  },
  async run({ propsValue, files }) {
    const encoding = propsValue.encoding as BufferEncoding ?? 'utf8';
    const fileUrl = await files.write({
      fileName: propsValue.fileName,
      data: Buffer.from(propsValue.content, encoding),
    });
    return { fileName: propsValue.fileName, url: fileUrl };
  },
});
