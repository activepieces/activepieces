import { Property, createAction } from '@activepieces/pieces-framework';
import AdmZip from 'adm-zip';

interface Result {
  file: string;
  filePath: string;
}

export const unzipFile = createAction({
  name: 'unzipFile',
  displayName: 'Unzip File',
  description: 'Unzip compressed zip file',
  props: {
    file: Property.File({
      displayName: 'Zip File',
      required: true,
    }),
  },
  async run(context) {
    const zipFile = new AdmZip(context.propsValue.file.data);

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
