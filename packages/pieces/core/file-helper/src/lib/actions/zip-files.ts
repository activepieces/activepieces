import {
  Property,
  createAction,
  ApFile,
  PieceAuth,
} from '@activepieces/pieces-framework';
import {
  ZipWriter,
  BlobWriter,
  BlobReader,
  ZipWriterAddDataOptions,
} from '@zip.js/zip.js';
import { zipFilesActionOutputSchema } from '../output-schemas';

interface FileObject {
  file: ApFile;
  filePath: string;
}

export const zipFiles = createAction({
  audience: 'both',
  name: 'zipFiles',
  classification: 'READ',
  displayName: 'Zip Files',
  description: 'Bundle one or more files into a zip archive.',
  aiMetadata: { description: 'Compresses one or many input files into a single zip archive, optionally placing each entry at a custom path inside the archive (e.g. foo/test.txt) and optionally password-protecting it with ZipCrypto or AES-256. Use it to bundle several files into one attachment or download; use Unzip File for the reverse direction. Requires the list of files and an output file name; entries default to their own file names, reusing the same in-zip path keeps only the later file, and there are no external side effects, so it is idempotent.', idempotent: true },
  outputSchema: zipFilesActionOutputSchema,
  props: {
    files: Property.Array({
      displayName: 'Files',
      description: 'One row per file to add to the archive.',
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'Pick a file from an earlier step or paste a URL to download.',
          required: true,
        }),
        filePath: Property.ShortText({
          displayName: 'Path in Zip',
          description: 'Folder and name inside the zip. Empty: the file name at the top level.',
          placeholder: 'reports/summary.pdf',
          required: false,
        }),
      },
      required: true,
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Include the .zip extension.',
      placeholder: 'archive.zip',
      required: true,
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use Password',
      description: 'Require a password to open the archive.',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password Options',
      required: false,
      auth: PieceAuth.None(),
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
          encryptionMethod: Property.StaticDropdown({
            displayName: 'Encryption Method',
            description: 'AES-256 is far safer; ZipCrypto opens in every unzip app but is weak.',
            required: true,
            defaultValue: 'zipcrypto',
            options: {
              disabled: false,
              options: [
                { label: 'ZipCrypto (Most Compatible)', value: 'zipcrypto' },
                { label: 'AES-256 (Stronger Security)', value: 'aes-256' },
              ],
            },
          }),
        };

        return fields;
      },
    }),
  },
  async run(context) {
    const fileProps = (context.propsValue.files as FileObject[]) ?? [];

    const blobWriter = new BlobWriter('application/zip');
    const zipWriter = new ZipWriter(blobWriter);

    const fileAddOptions: ZipWriterAddDataOptions = {};

    if (context.propsValue.usePassword) {
      const password = context.propsValue.passwordOptions?.[
        'password'
      ] as string;
      const encryptionMethod = context.propsValue.passwordOptions?.[
        'encryptionMethod'
      ] as string;

      fileAddOptions.password = password;

      switch (encryptionMethod) {
        case 'zipcrypto':
          fileAddOptions.zipCrypto = true;
          break;
        case 'aes-256':
          fileAddOptions.encryptionStrength = 3;
          break;
        default:
          fileAddOptions.zipCrypto = true;
          break;
      }
    }

    for (const fileProp of fileProps) {
      const zipFilePath = fileProp.filePath || fileProp.file.filename;
      const blob = new Blob([new Uint8Array(fileProp.file.data)]);
      await zipWriter.add(zipFilePath, new BlobReader(blob), fileAddOptions);
    }

    await zipWriter.close();
    const zipBlob = await blobWriter.getData();
    const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());

    return context.files.write({
      data: zipBuffer,
      fileName: context.propsValue.outputFileName,
    });
  },
});
