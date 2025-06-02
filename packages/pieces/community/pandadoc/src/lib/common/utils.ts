import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PandaDocDocumentResponse, PandaDocTemplateResponse } from './interfaces';

export const documentDropdown = Property.Dropdown({
  displayName: 'Document',
  description: 'Select a document',
  required: true,
  refreshers: [],
  options: async (propsValue) => {
    const auth = propsValue['auth'] as { apiKey: string };
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first'
      };
    }

    try {
      const response = await httpClient.sendRequest<PandaDocDocumentResponse>({
        method: HttpMethod.GET,
        url: 'https://api.pandadoc.com/public/v1/documents',
        headers: {
          'Authorization': `API-Key ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.body.results) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No documents found'
        };
      }

      return {
        disabled: false,
        options: response.body.results.map((document) => ({
          label: `${document.name} (${document.status})`,
          value: document.id,
        })),
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading documents'
      };
    }
  },
});

export const templateDropdown = Property.Dropdown({
  displayName: 'Template',
  description: 'Select a template to use',
  required: true,
  refreshers: [],
  options: async (propsValue) => {
    const auth = propsValue['auth'] as { apiKey: string };
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first'
      };
    }

    try {
      const response = await httpClient.sendRequest<PandaDocTemplateResponse>({
        method: HttpMethod.GET,
        url: 'https://api.pandadoc.com/public/v1/templates',
        headers: {
          'Authorization': `API-Key ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.body.results) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No templates found'
        };
      }

      return {
        disabled: false,
        options: response.body.results.map((template) => ({
          label: template.name,
          value: template.id,
        })),
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading templates'
      };
    }
  },
}); 