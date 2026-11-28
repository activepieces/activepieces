import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyClient, InklyDocumentStatus } from './client';
import { inklyTemplateInputs } from './template-inputs';

function template() {
  return Property.Dropdown({
    auth: inklyAuth,
    displayName: 'Template',
    description: 'The Inkly template to use. Type to search by name.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Inkly account first' };
      }
      const templates = await inklyClient.listTemplates({ apiKey: auth.secret_text, search: searchValue?.trim() || undefined });
      return {
        disabled: false,
        options: templates.map((item) => ({ label: item.title, value: item.id })),
        placeholder: templates.length === 0 ? 'No templates found. Create one in Inkly first.' : undefined,
      };
    },
  });
}

function templateInputs() {
  return Property.DynamicProperties({
    auth: inklyAuth,
    displayName: 'Signers and Prefilled Fields',
    description: "Each signer's email, and the values for the template's prefilled fields.",
    required: true,
    refreshers: ['template'],
    props: async ({ auth, template }) => {
      if (!auth || typeof template !== 'string' || template.length === 0) {
        return {};
      }
      const details = await inklyClient.getTemplate({ apiKey: auth.secret_text, templateId: template });
      const roleProps = details.roles.reduce<InputPropertyMap>(
        (props, role) => ({
          ...props,
          [inklyTemplateInputs.emailKey(role.role_id)]: Property.ShortText({
            displayName: `${role.label} Email`,
            description: role.role === 'cc' ? 'Gets a copy once everyone has signed.' : undefined,
            required: true,
          }),
          [inklyTemplateInputs.nameKey(role.role_id)]: Property.ShortText({
            displayName: `${role.label} Name`,
            required: false,
          }),
        }),
        {},
      );
      return inklyTemplateInputs.uniqueLabels(details.prefilled_fields).reduce<InputPropertyMap>(
        (props, field) => ({
          ...props,
          [inklyTemplateInputs.prefilledKey(field.label)]: Property.ShortText({
            displayName: field.label,
            required: field.required,
          }),
        }),
        roleProps,
      );
    },
  });
}

function document({ status, description }: { status?: InklyDocumentStatus; description: string }) {
  return Property.Dropdown({
    auth: inklyAuth,
    displayName: 'Document',
    description,
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Inkly account first' };
      }
      const documents = await inklyClient.listDocuments({
        apiKey: auth.secret_text,
        search: searchValue?.trim() || undefined,
        status,
        limit: 50,
      });
      return {
        disabled: false,
        options: documents.map((item) => ({ label: documentLabel(item), value: item.id })),
        placeholder: documents.length === 0 ? 'No matching documents found' : undefined,
      };
    },
  });
}

function documentLabel(item: { title: string; status: string; recipients: Array<{ email: string | null; role: string }> }): string {
  const signers = item.recipients
    .filter((recipient) => recipient.role === 'signer' && recipient.email)
    .map((recipient) => recipient.email);
  return signers.length > 0 ? `${item.title} (${item.status}, ${signers.join(', ')})` : `${item.title} (${item.status})`;
}

export const inklyProps = {
  template,
  templateInputs,
  document,
};
