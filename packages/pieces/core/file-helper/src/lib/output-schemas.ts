import { OutputSchema } from '@activepieces/pieces-framework';

// files.write() resolves to the new file's URL string, not an object -- value:
// '' labels the whole string so it isn't rendered as an unlabeled blob.
const fileUrlOutput = (description: string): OutputSchema => ({
  fields: [{ key: 'fileUrl', label: 'File URL', value: '', format: 'url', description }],
});

export const changeFileEncodingActionOutputSchema = fileUrlOutput(
  'Link to the re-encoded file.',
);

export const zipFilesActionOutputSchema = fileUrlOutput(
  'Link to the zip archive.',
);

export const checkFileTypeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'isMatch', label: 'Is Match', format: 'boolean' },
  ],
};

export const createFileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'fileName', label: 'File Name' },
    { key: 'url', label: 'File URL', format: 'url' },
  ],
};

export const getFileNameActionOutputSchema: OutputSchema = {
  fields: [{ key: 'fileName', label: 'File Name' }],
};

// Exactly one of these three is present, chosen by the Output Format dropdown.
export const readFileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Text', description: 'Present when Output Format is Text.' },
    { key: 'base64', label: 'Base64', description: 'Present when Output Format is Base64.' },
    {
      key: 'base64WithMimeType',
      label: 'Base64 Data URL',
      description: 'Present when Output Format is Base64.',
    },
  ],
};

export const unzipFileActionOutputSchema: OutputSchema = {
  itemLabel: '{filePath}',
  fields: [
    {
      key: 'files',
      label: 'Extracted Files',
      value: '',
      listItems: [
        { key: 'file', label: 'File URL', format: 'url' },
        { key: 'filePath', label: 'File Path' },
      ],
    },
  ],
};
