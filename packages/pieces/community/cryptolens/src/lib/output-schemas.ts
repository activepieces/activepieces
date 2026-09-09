import { OutputSchema } from '@activepieces/pieces-framework';

const envelopeFields: OutputSchema['fields'] = [
  { key: 'result', label: 'Result Code', format: 'number' },
  { key: 'message', label: 'Message' },
];

export const addCustomerActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'customerId', label: 'Customer ID', format: 'number' },
    { key: 'secret', label: 'Customer Secret' },
    { key: 'portalLink', label: 'Customer Portal Link', format: 'url' },
    ...envelopeFields,
  ],
};

export const createKeyActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'License Key' },
    {
      key: 'keys',
      label: 'License Keys',
      labelKey: 'key',
      listItems: [
        { key: 'key', label: 'License Key' },
        { key: 'result', label: 'Result Code', format: 'number' },
        { key: 'message', label: 'Message' },
      ],
    },
    ...envelopeFields,
  ],
};

export const blockKeyActionOutputSchema: OutputSchema = {
  fields: envelopeFields,
};

export const extendLicenseActionOutputSchema: OutputSchema = {
  fields: envelopeFields,
};

export const newApiEventTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID', format: 'number' },
    { key: 'productId', label: 'Product ID', format: 'number' },
    { key: 'key', label: 'License Key' },
    { key: 'ip', label: 'Caller IP' },
    { key: 'time', label: 'Time (Unix Seconds)', format: 'number' },
    { key: 'state', label: 'Event State', format: 'number' },
    { key: 'machineCode', label: 'Machine Code' },
    { key: 'friendlyName', label: 'Friendly Name' },
    { key: 'floatingExpires', label: 'Floating Expires', format: 'number' },
    { key: 'doIntValue', label: 'Data Object Int Value', format: 'number' },
    { key: 'doId', label: 'Data Object ID', format: 'number' },
  ],
};
