import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import {
  templateDropdown,
  folderDropdown,
  recipientRoleDropdown,
  customRecipientRoleInput,
  tagDropdown,
  customTagInput,
  templateFields,
} from '../common/dynamic-dropdowns';

export const createDocumentFromTemplate = createAction({
  name: 'createDocumentFromTemplate',
  displayName: 'Create Document from Template',
  description: 'Creates a document from a PandaDoc Template.',
  auth: pandadocAuth,
  props: {
    template_uuid: templateDropdown,
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name the document you are creating',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'List of recipients to whom the document will be sent',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Recipient email address',
          required: false,
        }),
        phone: Property.ShortText({
          displayName: 'Phone',
          description: 'Recipient phone number',
          required: false,
        }),
        first_name: Property.ShortText({
          displayName: 'First Name',
          required: false,
        }),
        last_name: Property.ShortText({
          displayName: 'Last Name',
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
    fields: templateFields,
    tokens: Property.Array({
      displayName: 'Variables/Tokens',
      description: 'Pass values for the variables in the template',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Variable Name',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Variable Value',
          required: true,
        }),
      },
    }),
    folder_uuid: folderDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag the document for filtering and organization',
      required: false,
      properties: {
        tag: tagDropdown,
        custom_tag: customTagInput,
      },
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'Additional data in key-value format to associate with document',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      template_uuid: propsValue.template_uuid,
      name: propsValue.name,
      recipients: propsValue.recipients?.map((recipient: any) => {
        const processedRecipient: any = {
          email: recipient.email,
          phone: recipient.phone,
          first_name: recipient.first_name,
          last_name: recipient.last_name,
          signing_order: recipient.signing_order,
        };

        // Handle role with custom support
        if (recipient.role) {
          if (recipient.role === 'custom' && recipient.custom_role) {
            processedRecipient.role = recipient.custom_role;
          } else if (recipient.role !== 'custom') {
            processedRecipient.role = recipient.role;
          }
        }

        return processedRecipient;
      }),
    };

    if (propsValue.fields) {
      body.fields = Object.fromEntries(
        Object.entries(propsValue.fields)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, { value }])
      );
    }

    if (propsValue.tokens) {
      body.tokens = propsValue.tokens;
    }

    if (propsValue.folder_uuid) {
      body.folder_uuid = propsValue.folder_uuid;
    }

    if (propsValue.tags) {
      body.tags = propsValue.tags
        .map((tagItem: any) => {
          // Handle tag with custom support
          if (tagItem.tag === 'custom' && tagItem.custom_tag) {
            return tagItem.custom_tag;
          } else if (tagItem.tag !== 'custom') {
            return tagItem.tag;
          }
          return null;
        })
        .filter(Boolean);
    }

    if (propsValue.metadata) {
      body.metadata = propsValue.metadata;
    }

    return await pandadocClient.makeRequest(
      auth as string,
      HttpMethod.POST,
      '/documents',
      body
    );
  },
});
