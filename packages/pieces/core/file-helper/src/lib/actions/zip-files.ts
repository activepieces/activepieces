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

interface FileObject {
  file: ApFile;
  filePath: string;
}

const filePathDescription = `
- You can put files in specific folders eg. foo/test.txt
- If not specified, the file would be at the top level of the zip file.
- If the same File Path is specified for different files, the later file would take precedence.
`;

const encryptionMethodDescription = `
- ZipCrypto: Legacy encryption method with wide compatibility (not recommended for sensitive data)
- AES-256: Modern encryption with strong security (may not be supported by older zip clients)
`;

export const zipFiles = createAction({
  audience: 'both',
  name: 'zipFiles',
  displayName: 'Zip Files',
  description: 'Create compressed zip file from one or many files',
  aiMetadata: { description: 'Compresses one or many input files into a single zip archive, optionally placing each entry at a custom path inside the archive (e.g. foo/test.txt) and optionally password-protecting it with ZipCrypto or AES-256. Use it to bundle several files into one attachment or download; use Unzip File for the reverse direction. Requires the list of files and an output file name; entries default to their own file names, reusing the same in-zip path keeps only the later file, and there are no external side effects, so it is idempotent.', idempotent: true },
  props: {
    files: Property.Array({
      displayName: 'Files',
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
        filePath: Property.ShortText({
          displayName: 'File Path in zip',
          description: filePathDescription,
          required: false,
        }),
      },
      required: true,
    }),
    outputFileName: Property.ShortText({
      displayName: 'Name of zipped file',
      required: true,
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use password',
      description: 'Enable password protection for the zip file',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password options',
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
            description: encryptionMethodDescription,
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

    // Add encryption if password is provided
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
          // Default to ZipCrypto for compatibility
          fileAddOptions.zipCrypto = true;
          break;
      }
    }

    for (const fileProp of fileProps) {
      // default to file name if filePath not explicitly provided
      const zipFilePath = fileProp.filePath ?? fileProp.file.filename;
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
