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

export const fillPdfFormActionOutputSchema = pdfUrlOutput(
  'Link to the filled PDF, ready to merge, attach to an email or upload.',
);

export const inspectPdfFormActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'kind',
      label: 'Form Kind',
      description:
        'acroform: a fillable form Fill PDF Form can fill. xfa: an Adobe XFA form, which it cannot fill. flat: no form fields. encrypted: password-protected, so the fields cannot be read.',
    },
    {
      key: 'pageCount',
      label: 'Page Count',
      format: 'number',
      description: 'Empty when the PDF could not be opened.',
    },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      description:
        'In page order, top to bottom. Empty unless the kind is acroform.',
      listItems: [
        {
          key: 'name',
          label: 'Name',
          description: "The key to use in Fill PDF Form's Data (JSON).",
        },
        {
          key: 'label',
          label: 'Label',
          description:
            "The field's tooltip, or the caption printed by it in the form's XFA part. Empty when the form has neither.",
        },
        {
          key: 'type',
          label: 'Type',
          description:
            'text, checkbox, radio, dropdown, list, button or signature.',
        },
        { key: 'page', label: 'Page', format: 'number' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'readOnly', label: 'Read-Only', format: 'boolean' },
        {
          key: 'maxLength',
          label: 'Max Length',
          format: 'number',
          description:
            'The most characters a text field takes, if it has a limit.',
        },
        { key: 'multiline', label: 'Multiline', format: 'boolean' },
        {
          key: 'multiSelect',
          label: 'Multiple Choices',
          format: 'boolean',
          description: 'Whether a dropdown or list takes more than one option.',
        },
        {
          key: 'options',
          label: 'Options',
          description: 'The allowed values of a radio, dropdown or list field.',
        },
        {
          key: 'value',
          label: 'Value',
          description:
            "What the field holds now, in the shape Fill PDF Form's Data (JSON) takes: text, true or false for a checkbox, the chosen option, or a list for a multi-select list. Empty when nothing is filled in.",
        },
      ],
    },
    {
      key: 'emptyData',
      label: 'Empty Data',
      dynamicKey: true,
      description:
        "Every fillable field set to null. Paste it into Fill PDF Form's Data (JSON) and replace the nulls with values.",
    },
  ],
};
