import { createAction, Property } from '@activepieces/pieces-framework';
import { encodings } from '../common/encodings';
import { createFileActionOutputSchema } from '../output-schemas';

export const createFile = createAction({
  audience: 'both',
  name: 'createFile',
  classification: 'READ',
  displayName: 'Create File',
  description: 'Save text as a new file.',
  aiMetadata: { description: 'Writes a text string out to a new file with the given file name and character encoding (utf8 by default). Use it when a downstream step needs an actual file rather than a value - for example to attach generated CSV or JSON text to an email - and use Read File for the opposite direction. Requires the content and file name, and the encoding must be one of the supported Buffer encodings; nothing outside the run is changed, so it is idempotent.', idempotent: true },
  outputSchema: createFileActionOutputSchema,
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'The text to write into the file.',
      placeholder: 'Hello, world',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Include the extension so other steps know the file type.',
      placeholder: 'report.txt',
      required: true,
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Encoding',
      description: 'How to read the content. Keep UTF-8 for text, Base64 for binary data.',
      required: true,
      defaultValue: 'utf8',
      options: {
        options: encodings,
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
