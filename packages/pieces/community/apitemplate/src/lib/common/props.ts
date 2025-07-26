import { Property } from '@activepieces/pieces-framework';

export const templateIdProp = Property.ShortText({
  displayName: 'Template ID',
  description: 'The ID of the template to use',
  required: true,
});

export const dataProp = Property.Json({
  displayName: 'Template Data',
  description: 'JSON data to fill the template variables',
  required: true,
  defaultValue: {},
});

export const overridesProp = Property.Json({
  displayName: 'JSON Overrides',
  description: 'Override specific properties of elements in the template',
  required: false,
});

export const htmlProp = Property.LongText({
  displayName: 'HTML Content',
  description: 'HTML content to convert to PDF',
  required: true,
});

export const urlProp = Property.ShortText({
  displayName: 'URL',
  description: 'URL of the webpage to convert to PDF',
  required: true,
});

export const transactionRefProp = Property.ShortText({
  displayName: 'Transaction Reference',
  description: 'The transaction reference of the object to delete',
  required: true,
});

export const limitProp = Property.Number({
  displayName: 'Limit',
  description: 'Maximum number of results to return',
  required: false,
  defaultValue: 100,
});

export const offsetProp = Property.Number({
  displayName: 'Offset',
  description: 'Number of results to skip',
  required: false,
  defaultValue: 0,
});

export const pdfOptionsProp = Property.Json({
  displayName: 'PDF Options',
  description: 'Advanced PDF generation options (e.g., { "paper_size": "A4", "landscape": false, "margin_top": 20 })',
  required: false,
  defaultValue: {
    paper_size: 'A4',
    landscape: false,
  },
});