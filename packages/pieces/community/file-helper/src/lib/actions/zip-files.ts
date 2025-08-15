import { Property, createAction, ApFile } from '@activepieces/pieces-framework';
import AdmZip from 'adm-zip';

interface FileObject {
  file: ApFile;
  filePath: string;
}

const filePathDescription = `
- You can put files in specific folders eg. foo/test.txt
- If not specified, the file would be at the top level of the zip file.
- If the same File Path is specified for different files, the later file would take precedence.
`;

export const zipFiles = createAction({
  name: 'zipFiles',
  displayName: 'Zip Files',
  description: 'Create compressed zip file from one or many files',
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
  },
  async run(context) {
    const fileProps = (context.propsValue.files as FileObject[]) ?? [];

    const zipFile = new AdmZip();

    fileProps.forEach((fileProp) => {
      // default to file name if filePath not explicitly provided
      const zipFilePath = fileProp.filePath ?? fileProp.file.filename;
      zipFile.addFile(zipFilePath, fileProp.file.data);
    });

    return context.files.write({
      data: zipFile.toBuffer(),
      fileName: context.propsValue.outputFileName,
    });
  },
});
