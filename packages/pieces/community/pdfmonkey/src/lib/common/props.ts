import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const documenttemplateidDropdown = Property.Dropdown({
  displayName: 'documenttemplate ID',
  description:
    'Select the document template ID to use for the document generation',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/document_template_cards'
      );
      return {
        disabled: false,
        options: response.document_template_cards.map((template: any) => ({
          label: template.identifier,
          value: template.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading document templates',
      };
    }
  },
});

export const documentIdDropdown = Property.Dropdown({
  displayName: 'Document ID',
  description: 'Select the document ID to use for the action',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/document_cards'
      );
      return {
        disabled: false,
        options: response.document_cards.map((document: any) => ({
          label: document.filename,
          value: document.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading documents',
      };
    }
  },
});
