import {
  Property,
  createAction,
  PieceAuth,
} from '@activepieces/pieces-framework';
import {
  ZipReader,
  BlobReader,
  BlobWriter,
  getMimeType,
  EntryGetDataOptions,
} from '@zip.js/zip.js';

interface Result {
  file: string;
  filePath: string;
}

const maxResultsDescription = `
Throw an error if zip file has more than expected entries.
- This is a safe measure when working with untrusted zip files.
- Exclude this field or set to 0 to skip this check.
`;

export const unzipFile = createAction({
  name: 'unzipFile',
  displayName: 'Unzip File',
  description: 'Unzip compressed zip file',
  props: {
    file: Property.File({
      displayName: 'Zip File',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: maxResultsDescription,
      defaultValue: 0,
      required: false,
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use password',
      description: 'Enable if the zip file is password protected',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password options',
      auth: PieceAuth.None(),
      required: false,
      refreshers: ['usePassword'],
      props: async ({ usePassword }) => {
        if (!usePassword) {
          return {};
        }

        const fields = {
          password: Property.ShortText({
            displayName: 'Password',
            required: true,
          }),
        };

        return fields;
      },
    }),
  },
  async run(context) {
    const blob = new Blob([new Uint8Array(context.propsValue.file.data)]);
    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries();

    const maxResults = context.propsValue.maxResults || 0;

    if (maxResults !== 0 && entries.length > maxResults) {
      await zipReader.close();
      throw `Zip file contains more entries than allowed: ${entries.length}`;
    }

    // Prepare options for getData, including password if provided
    const getDataOptions: EntryGetDataOptions = {};
    if (context.propsValue.usePassword) {
      const password = context.propsValue.passwordOptions?.[
        'password'
      ] as string;
      getDataOptions.password = password;
    }

    const results: Result[] = [];

    for (const entry of entries) {
      if (!entry.directory) {
        const mimeType = getMimeType(entry.filename);

        const blob = await entry.getData(
          new BlobWriter(mimeType),
          getDataOptions
        );
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileBaseName = entry.filename.split('/').pop() || entry.filename;
        const fileReference = await context.files.write({
          data: buffer,
          fileName: fileBaseName,
        });

        results.push({
          file: fileReference,
          filePath: entry.filename,
        });
      }
    }

    await zipReader.close();
    return results;
  },
});
