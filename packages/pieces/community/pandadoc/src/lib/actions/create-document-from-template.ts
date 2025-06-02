import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

interface PandaDocTemplate {
  id: string;
  name: string;
  date_created: string;
  date_modified: string;
  version: string;
  status: string;
}

interface PandaDocTemplateResponse {
  results: PandaDocTemplate[];
  count: number;
}

export const createDocumentFromTemplate = createAction({
  auth: pandadocAuth,
  name: 'createDocumentFromTemplate',
  displayName: 'Create Document from Template',
  description: 'Create a new document from a template',
  props: {
    templateId: Property.Dropdown({
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
    }),
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'The name of the document',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'List of recipients for the document',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Email address of the recipient',
          required: true,
        }),
        firstName: Property.ShortText({
          displayName: 'First Name',
          description: 'First name of the recipient',
          required: false,
        }),
        lastName: Property.ShortText({
          displayName: 'Last Name',
          description: 'Last name of the recipient',
          required: false,
        }),
        role: Property.ShortText({
          displayName: 'Role',
          description: 'Role of the recipient (e.g., "Signer", "Viewer")',
          required: false,
        }),
      },
    }),
    tokens: Property.Object({
      displayName: 'Template Tokens',
      description: 'Key-value pairs to replace in the template',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the document',
      required: false,
    }),
  },
  async run(context) {
    const { templateId, name, recipients, tokens, metadata } =
      context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pandadoc.com/public/v1/documents',
      headers: {
        Authorization: `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        name,
        template_uuid: templateId,
        recipients,
        tokens,
        metadata,
      },
    });

    return response.body;
  },
});
