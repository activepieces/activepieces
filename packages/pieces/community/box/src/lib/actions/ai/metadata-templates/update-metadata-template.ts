import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateMetadataTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_update_metadata_template',
  displayName: 'Update Metadata Template',
  description: 'Changes the fields and options of a Box metadata template.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Applies template operations atomically (if one fails, nothing changes); needs admin rights. removeField, removeEnumOption and removeMultiSelectOption also erase those values from every file and folder, permanently. Scope and template key come from List Enterprise Metadata Templates.',
    idempotent: false,
  },
  props: {
    scope: boxAiProps.metadataScope({
      required: true,
      description: '"enterprise" (or "enterprise_<id>"); global templates can\'t be changed.',
    }),
    templateKey: boxAiProps.metadataTemplateKey({ required: true }),
    operations: Property.Json({
      displayName: 'Operations',
      description:
        'JSON array of operations. op is editTemplate, addField, reorderFields, addEnumOption, reorderEnumOptions, reorderMultiSelectOptions, addMultiSelectOption, editField, removeField, editEnumOption, removeEnumOption, editMultiSelectOption or removeMultiSelectOption; with data, fieldKey, fieldKeys, enumOptionKey, enumOptionKeys, multiSelectOptionKey or multiSelectOptionKeys as the op needs. E.g. [{"op": "addField", "data": {"type": "string", "key": "client", "displayName": "Client"}}].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.operations) || propsValue.operations.length === 0) {
      throw new Error('Operations must be a non-empty JSON array of template operations.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/metadata_templates/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}/schema`,
      headers: { 'Content-Type': 'application/json-patch+json' },
      body: propsValue.operations,
    });
  },
});
