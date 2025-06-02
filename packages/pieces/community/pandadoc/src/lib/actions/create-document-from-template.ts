import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

export const createDocumentFromTemplate = createAction({
  auth: pandadocAuth,
  name: 'createDocumentFromTemplate',
  displayName: 'Create Document from Template',
  description: 'Create a new document from a template',
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
      required: true,
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
          required: true,
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
