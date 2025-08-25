import { Property, createAction } from '@activepieces/pieces-framework';
import AdmZip from 'adm-zip';

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
  },
  async run(context) {
    const zipFile = new AdmZip(context.propsValue.file.data);

    const maxResults = context.propsValue.maxResults || 0;

    if (maxResults !== 0 && zipFile.getEntryCount() > maxResults) {
      throw `Zip file contains more entries than allowed: ${zipFile.getEntryCount()}`;
    }

    const results: Result[] = [];
    zipFile.forEach(async (zipEntry) => {
      if (!zipEntry.isDirectory) {
        const fileReference = await context.files.write({
          data: zipEntry.getData(),
          fileName: zipEntry.name,
        });

        results.push({
          file: fileReference,
          filePath: zipEntry.entryName,
        });
      }
    });

    return results;
  },
});
