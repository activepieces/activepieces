import { OutputSchema } from '@activepieces/pieces-framework';

// files.write() resolves to the new file's URL string, not an object -- value:
// '' labels the whole string so it isn't rendered as an unlabeled blob.
const pdfUrlOutput = (description: string): OutputSchema => ({
  fields: [{ key: 'fileUrl', label: 'PDF File URL', value: '', format: 'url', description }],
});

export const addImageToPdfActionOutputSchema = pdfUrlOutput(
  'Link to the PDF with the stamped image(s).',
);

export const addTextToPdfActionOutputSchema = pdfUrlOutput(
  'Link to the PDF with the stamped text.',
);

export const extractPdfPagesActionOutputSchema = pdfUrlOutput(
  'Link to the new PDF built from the selected page ranges.',
);

export const imageToPdfActionOutputSchema = pdfUrlOutput(
  'Link to the generated one-page PDF.',
);

export const mergePdfsActionOutputSchema = pdfUrlOutput('Link to the merged PDF.');

export const textToPdfActionOutputSchema = pdfUrlOutput('Link to the generated PDF.');

export const extractTextActionOutputSchema: OutputSchema = {
  fields: [{ key: 'text', label: 'Extracted Text', value: '' }],
};

export const pdfPageCountActionOutputSchema: OutputSchema = {
  fields: [{ key: 'pageCount', label: 'Page Count', value: '', format: 'number' }],
};

// Exactly one of these is present, chosen by the Output Image Type dropdown.
export const convertToImageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'image',
      label: 'Combined Image URL',
      format: 'url',
      description: 'Present when Output Image Type is Single Combined Image.',
    },
    {
      key: 'images',
      label: 'Image URLs',
      format: 'url',
      description:
        'Present when Output Image Type is Separate Image for Each Page. One URL per page.',
    },
  ],
};
