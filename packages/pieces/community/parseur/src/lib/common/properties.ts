import { Property } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '.';

export const parserDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: parseurAuth,
    displayName: 'Parser',
    description: 'Select the parser',
    required,
    refreshers: ['auth'],
    refreshOnSearch: true,
    options: async ({ auth: apiKey }, { searchValue: search }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Please select an API Key first',
          options: [],
        };
      }
      if (search != undefined) {
        const response = await parseurCommon.listMailboxes({
          apiKey: apiKey.secret_text,
          search,
        });
        return {
          disabled: false,
          options: response.results.map((parser) => ({
            label: parser.name,
            value: parser.id,
          })),
        };
      } else {
        const response = await parseurCommon.listMailboxes({
          apiKey: apiKey.secret_text,
        });
        return {
          disabled: false,
          options: response.results.map((parser) => ({
            label: parser.name,
            value: parser.id,
          })),
        };
      }
    },
  });

export const documentDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: parseurAuth,
    displayName: 'Document',
    description: 'Select the document',
    required,
    refreshers: ['auth', 'parserId'],
    refreshOnSearch: true,
    options: async ({ auth: apiKey, parserId }, { searchValue: search }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Please select an API Key first',
          options: [],
        };
      }
      if (!parserId) {
        return {
          disabled: true,
          placeholder: 'Please select a Parser first',
          options: [],
        };
      }
      if (search != undefined) {
        const response = await parseurCommon.listDocuments({
          apiKey: apiKey.secret_text,
          parserId: parserId as number,
          search,
        });
        return {
          disabled: false,
          options: response.results.map((document) => ({
            label: document.name,
            value: document.id.toString(),
          })),
        };
      } else {
        const response = await parseurCommon.listDocuments({
          apiKey: apiKey.secret_text,
          parserId: parserId as number,
        });
        return {
          disabled: false,
          options: response.results.map((document) => ({
            label: document.name,
            value: document.id.toString(),
          })),
        };
      }
    },
  });
