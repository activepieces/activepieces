import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { outputSchemas } from '../../common/output-schemas';
import { aiProps, DELETE_RECORD_OPTIONS, GET_RECORD_OPTIONS } from '../../common/props';

function flatten(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      result[key] = value;
    }
  }
  for (const field of insightlyUtils.toRecords(record['CUSTOMFIELDS'])) {
    const name = insightlyUtils.readString(field['FIELD_NAME']);
    if (name) {
      result[name] = field['FIELD_VALUE'] ?? null;
    }
  }
  const tags = insightlyUtils.toRecords(record['TAGS']).flatMap((tag) => {
    const name = insightlyUtils.readString(tag['TAG_NAME']);
    return name ? [name] : [];
  });
  if (tags.length > 0) {
    result['TAGS'] = tags;
  }
  return result;
}

export const aiGetRecord = createAction({
  auth: insightlyAuth,
  name: 'ai_get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Get a lead, opportunity, organization, project, task, event, product or quote by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns all fields (including custom fields and tag names) of one Insightly lead, opportunity, organization, project, task, event, product or quote by ID. For contacts use Get Contact instead. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['aiRecord'],
  props: {
    objectType: aiProps.objectType({ options: GET_RECORD_OPTIONS, description: 'Type of record. Contacts are read with Get Contact.' }),
    recordId: Property.Number({ displayName: 'Record ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const objectName = insightlyCommon.ensureObject(propsValue.objectType);
    if (!GET_RECORD_OPTIONS.some((option) => option.value === objectName)) {
      throw new Error('Use Get Contact to read contacts.');
    }
    const recordId = insightlyUtils.toId({ value: propsValue.recordId, label: 'Record ID' });
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/${objectName}/${recordId}` }));
    return { id: recordId, objectType: objectName, fields: flatten(record) };
  },
});

export const aiDeleteRecord = createAction({
  auth: insightlyAuth,
  name: 'ai_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Permanently delete a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Insightly record (contact, lead, opportunity, organization, project, task, event, note, product or quote) by ID. Cannot be undone; only use when the user asked to delete. Repeating the call on a deleted record fails with not found.',
    idempotent: false,
  },
  outputSchema: outputSchemas['aiDeletedRecord'],
  props: {
    objectType: aiProps.objectType({ options: DELETE_RECORD_OPTIONS, description: 'Type of record to delete.' }),
    recordId: Property.Number({ displayName: 'Record ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const objectName = insightlyCommon.ensureObject(propsValue.objectType);
    const recordId = insightlyUtils.toId({ value: propsValue.recordId, label: 'Record ID' });
    const connection = await insightlyCommon.connect({ auth });
    await insightlyCommon.call({ connection, method: HttpMethod.DELETE, path: `/${objectName}/${recordId}` });
    return { deleted: true, id: recordId, objectType: objectName };
  },
});
