import { OutputSchema } from '@activepieces/pieces-framework';

const entityFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'mentionText', label: 'Text' },
  { key: 'confidence', label: 'Confidence', format: 'number' },
  { key: 'normalizedText', label: 'Normalized Text' },
  { key: 'normalizedValue', label: 'Normalized Value', description: 'Typed value Google derived (money, date, address…); its keys depend on the entity type' },
  { key: 'id', label: 'Entity ID' },
  { key: 'page', label: 'Page', format: 'number' },
];

export const processDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'processor', label: 'Processor' },
    { key: 'text', label: 'Text', description: 'Full text of the document as read by the processor' },
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'pageCount', label: 'Page Count', format: 'number' },
    {
      key: 'languages',
      label: 'Languages',
      labelKey: 'languageCode',
      listItems: [
        { key: 'languageCode', label: 'Language Code' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
      ],
    },
    {
      key: 'entities',
      label: 'Entities',
      description: 'Filled by specialized processors (invoice, expense, ID) and Custom Extractors',
      labelKey: 'type',
      listItems: [
        ...entityFields,
        {
          key: 'properties',
          label: 'Properties',
          labelKey: 'type',
          listItems: entityFields,
        },
      ],
    },
    {
      key: 'formFields',
      label: 'Form Fields',
      description: 'Key and value pairs found by the Form Parser',
      labelKey: 'name',
      listItems: [
        { key: 'page', label: 'Page', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' },
        { key: 'nameConfidence', label: 'Name Confidence', format: 'number' },
        { key: 'valueConfidence', label: 'Value Confidence', format: 'number' },
        { key: 'valueType', label: 'Value Type' },
      ],
    },
    {
      key: 'tables',
      label: 'Tables',
      description: 'Tables found by the Form Parser, each cell as plain text',
      listItems: [
        { key: 'page', label: 'Page', format: 'number' },
        { key: 'headerRows', label: 'Header Rows' },
        { key: 'bodyRows', label: 'Body Rows' },
      ],
    },
    {
      key: 'humanReviewStatus',
      label: 'Human Review Status',
      description: 'Only present when the processor has human review configured',
      children: [
        { key: 'state', label: 'State' },
        { key: 'stateMessage', label: 'State Message' },
        { key: 'humanReviewOperation', label: 'Human Review Operation' },
      ],
    },
    {
      key: 'document',
      label: 'Full Document',
      description: 'Raw Document AI document, only present when Include Full Document is on',
    },
  ],
};
