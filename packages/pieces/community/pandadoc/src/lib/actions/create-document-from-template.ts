import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
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
  auth: pandadocAuth,
  name: 'createDocumentFromTemplate',
  classification: 'WRITE',
  displayName: 'Create Document from Template',
  description: 'Creates a document from a PandaDoc Template.',
  audience: 'human',
  aiMetadata: {
    description:
      'Create a new PandaDoc document from a template, with recipients, merge-field values, variables, folder, tags and metadata. Not idempotent: each call creates another document.',
    idempotent: false,
  },
  props: {
    template_uuid: templateDropdown,
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name the document you are creating',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'People who will receive the document. Use the role names defined in the template so they get the right fields.',
      required: true,
      properties: {
        email: Property.ShortText({ displayName: 'Email', description: 'Recipient email address', required: false }),
        phone: Property.ShortText({ displayName: 'Phone', description: 'Recipient phone number', required: false }),
        first_name: Property.ShortText({ displayName: 'First Name', required: false }),
        last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
        role: recipientRoleDropdown,
        custom_role: customRecipientRoleInput,
        signing_order: Property.Number({ displayName: 'Signing Order', description: 'Set a signing order for recipient', required: false }),
      },
    }),
    fields: templateFields,
    tokens: Property.Array({
      displayName: 'Variables/Tokens',
      description: 'Pass values for the variables in the template',
      required: false,
      properties: {
        name: Property.ShortText({ displayName: 'Variable Name', required: true }),
        value: Property.ShortText({ displayName: 'Variable Value', required: true }),
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
      description: 'Additional data in key-value format to associate with document',
      required: false,
    }),
    wait_until_ready: Property.Checkbox({
      displayName: 'Wait Until Ready to Send',
      description:
        'PandaDoc prepares new documents in the background. Turn this on to wait (up to 90 seconds) until the document is in draft, so a following Send Document step does not fail.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: pandadocSchemas['rawCreatedDocument'],
  async run({ auth, propsValue }) {
    const fields = pandadocInputs.fieldValues(propsValue.fields);
    const tokens = pandadocInputs.tokenList(propsValue.tokens);
    const tags = (propsValue.tags ?? []).flatMap((item) => {
      const tag = pandadocInputs.pickCustom({ value: readKey({ item, key: 'tag' }), custom: readKey({ item, key: 'custom_tag' }) });
      return tag === undefined ? [] : [tag];
    });
    const metadata = pandadocInputs.stringRecord(propsValue.metadata);
    const body = {
      template_uuid: pandadocInputs.requiredString({ value: propsValue.template_uuid, label: 'Template' }),
      name: pandadocInputs.requiredString({ value: propsValue.name, label: 'Document Name' }),
      recipients: pandadocInputs.recipients(propsValue.recipients),
      ...(Object.keys(fields).length > 0 ? { fields } : {}),
      ...(tokens.length > 0 ? { tokens } : {}),
      ...(propsValue.folder_uuid ? { folder_uuid: propsValue.folder_uuid } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    return pandadocApi.createDocumentRaw({ apiKey: auth.secret_text, body, waitForDraft: propsValue.wait_until_ready === true });
  },
});

function readKey({ item, key }: { item: unknown; key: string }): unknown {
  return item !== null && typeof item === 'object' ? Reflect.get(item, key) : undefined;
}
