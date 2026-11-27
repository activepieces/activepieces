import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ASSIGN_TO_TYPES = ['enterprise', 'folder', 'metadata_template'];

export const assignRetentionPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_assign_retention_policy',
  displayName: 'Assign Retention Policy',
  description: 'Applies a Box retention policy to a folder, the enterprise or a metadata template.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a retention policy to a folder, the whole enterprise or files with a metadata template, and returns the assignment ID. Assign To ID is required except for "enterprise". Get the policy ID from List Retention Policies; remove it with Delete Retention Policy Assignment.',
    idempotent: false,
  },
  props: {
    policyId: boxAiProps.retentionPolicyId({ required: true }),
    assignToType: Property.StaticDropdown({
      displayName: 'Assign To Type',
      description: '"folder", "enterprise" or "metadata_template".',
      required: true,
      options: { options: ASSIGN_TO_TYPES.map((value) => ({ label: value, value })) },
    }),
    assignToId: Property.ShortText({
      displayName: 'Assign To ID',
      description: 'Folder ID (from List Folder Items) or metadata template ID (from List Enterprise Metadata Templates). Leave empty for "enterprise".',
      required: false,
    }),
    filterFields: Property.Array({
      displayName: 'Filter Fields',
      description: 'For "metadata_template" only: one {field, value} pair; only files whose metadata field has this option are retained.',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field', description: 'Metadata template field key ID.', required: true }),
        value: Property.ShortText({ displayName: 'Value', description: 'ID of the enum or multiselect option.', required: true }),
      },
    }),
    startDateField: Property.ShortText({
      displayName: 'Start Date Field',
      description: 'For "metadata_template": key of a date field whose value starts the retention. Defaults to the upload date.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!ASSIGN_TO_TYPES.includes(propsValue.assignToType)) {
      throw new Error(`Assign To Type must be one of: ${ASSIGN_TO_TYPES.join(', ')}.`);
    }
    if (propsValue.assignToType === 'enterprise' && propsValue.assignToId !== undefined) {
      throw new Error('Leave Assign To ID empty when Assign To Type is "enterprise".');
    }
    if (propsValue.assignToType !== 'enterprise' && propsValue.assignToId === undefined) {
      throw new Error(`Assign To ID is required when Assign To Type is "${propsValue.assignToType}".`);
    }
    const filterFields = propsValue.filterFields?.length ? propsValue.filterFields : undefined;
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/retention_policy_assignments',
      body: {
        policy_id: propsValue.policyId,
        assign_to: {
          type: propsValue.assignToType,
          ...(propsValue.assignToId !== undefined ? { id: propsValue.assignToId } : {}),
        },
        ...(filterFields !== undefined ? { filter_fields: filterFields } : {}),
        ...(propsValue.startDateField !== undefined ? { start_date_field: propsValue.startDateField } : {}),
      },
    });
  },
});
