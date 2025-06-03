import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import {
  customRecipientRoleInput,
  recipientRoleDropdown,
  templateDropdown,
} from '../common/utils';
import { pandadocAuth } from '../common/auth';

export const createDocumentFromTemplate = createAction({
  auth: pandadocAuth,
  name: 'createDocumentFromTemplate',
  displayName: 'Create Document from Template',
  description: 'Create a new document from a template',
  props: {
    templateId: templateDropdown,
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
        first_name: Property.ShortText({
          displayName: 'First Name',
          description: 'First name of the recipient',
          required: false,
        }),
        last_name: Property.ShortText({
          displayName: 'Last Name',
          description: 'Last name of the recipient',
          required: false,
        }),
        role: recipientRoleDropdown,
        custom_role: customRecipientRoleInput,
        signing_order: Property.Number({
          displayName: 'Signing Order',
          description: 'Set a signing order for recipient',
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
