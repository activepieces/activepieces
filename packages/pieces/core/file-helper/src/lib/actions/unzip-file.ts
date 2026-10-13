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
import { unzipFileActionOutputSchema } from '../output-schemas';

interface Result {
  file: string;
  filePath: string;
}

export const unzipFile = createAction({
  audience: 'both',
  name: 'unzipFile',
  classification: 'READ',
  displayName: 'Unzip File',
  description: 'Extract every file inside a zip archive.',
  aiMetadata: { description: 'Extracts every file entry from a zip archive, writing each one out as its own file; supports password-protected archives. Use it to reach the contents of a zip attachment before processing them; use Zip Files for the reverse direction. Set Max Files to throw when an untrusted archive exceeds that entry count; directory entries are skipped, a wrong or missing password makes extraction fail, and the source archive is unchanged, so it is idempotent.', idempotent: true },
  outputSchema: unzipFileActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'Zip File',
      description: 'Pick a zip from an earlier step or paste a URL to download.',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Files',
      description: 'Fail if the zip holds more files than this. 0 or empty: no limit.',
      defaultValue: 0,
      required: false,
      advanced: true,
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use Password',
      description: 'Turn on if the zip needs a password to open.',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password Options',
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

    const fileEntries = entries.filter((entry) => !entry.directory);

    const maxResults = context.propsValue.maxResults || 0;

    if (maxResults !== 0 && fileEntries.length > maxResults) {
      await zipReader.close();
      throw new Error(
        `Zip file contains more files than allowed: ${fileEntries.length}`
      );
    }

    const getDataOptions: EntryGetDataOptions = {};
    if (context.propsValue.usePassword) {
      const password = context.propsValue.passwordOptions?.[
        'password'
      ] as string;
      getDataOptions.password = password;
    }

    const results: Result[] = [];

    for (const entry of fileEntries) {
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

    await zipReader.close();
    return results;
  },
});
