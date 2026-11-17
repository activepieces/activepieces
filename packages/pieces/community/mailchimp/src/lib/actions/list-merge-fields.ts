import { createAction } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const listMergeFields = createAction({
  auth: mailchimpAuth,
  name: 'list_merge_fields',
  classification: 'READ',
  displayName: 'List Merge Fields',
  description: 'List the merge fields (custom contact fields) of an audience.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every merge field (custom contact field) of one audience (list_id): merge tag such as FNAME, label, type, whether it is required, and the choices for dropdown/radio fields. Use the merge tag as the key in merge field JSON when adding or updating members. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['mergeFields'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const fields = await client.listAll<MergeField>({
      path: `/lists/${encodeURIComponent(listId)}/merge-fields`,
      itemsKey: 'merge_fields',
      operation: 'list merge fields',
    });
    return {
      merge_fields: fields.map((field) => ({
        merge_id: field.merge_id,
        tag: field.tag,
        name: field.name,
        type: field.type,
        required: field.required ?? false,
        default_value: field.default_value ?? '',
        choices: field.options?.choices ?? [],
      })),
      total_items: fields.length,
    };
  },
});

type MergeField = {
  merge_id: number;
  tag: string;
  name: string;
  type: string;
  required?: boolean;
  default_value?: string;
  options?: { choices?: string[] };
};
