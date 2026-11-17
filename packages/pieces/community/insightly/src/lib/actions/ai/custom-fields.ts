import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { InsightlyError, insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { outputSchemas } from '../../common/output-schemas';
import { aiProps, CUSTOM_FIELD_OBJECT_OPTIONS } from '../../common/props';

export const aiListCustomFields = createAction({
  auth: insightlyAuth,
  name: 'ai_list_custom_fields',
  classification: 'SEARCH',
  displayName: 'List Custom Fields',
  description: 'List custom fields of an object type.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the custom fields defined for an Insightly object type (field name, label, type, dropdown options). Use the field name with Set Custom Field. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['customFields'],
  props: {
    objectType: aiProps.objectType({ options: CUSTOM_FIELD_OBJECT_OPTIONS, description: 'Object type whose custom fields to list.' }),
  },
  async run({ auth, propsValue }) {
    const objectName = insightlyCommon.ensureObject(propsValue.objectType);
    const connection = await insightlyCommon.connect({ auth });
    const fields = insightlyUtils.toRecords(insightlyUtils.sanitize(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/CustomFields/${objectName}` })));
    return {
      fields: fields.map((field) => ({
        name: insightlyUtils.readString(field['FIELD_NAME']),
        label: insightlyUtils.readString(field['FIELD_LABEL']),
        type: insightlyUtils.readString(field['FIELD_TYPE']),
        options: insightlyUtils.toRecords(field['CUSTOM_FIELD_OPTIONS']).flatMap((option) => {
          const value = insightlyUtils.readString(option['OPTION_VALUE']);
          return value === null ? [] : [value];
        }),
      })),
    };
  },
});

export const aiSetCustomField = createAction({
  auth: insightlyAuth,
  name: 'ai_set_custom_field',
  classification: 'WRITE',
  displayName: 'Set Custom Field',
  description: 'Set one custom field value on a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets one custom field on an Insightly record. Field names (ending in __c) come from List Custom Fields; for dropdown fields pass one of the listed options, for dates use YYYY-MM-DD. Repeating the call leaves the same value.',
    idempotent: true,
  },
  outputSchema: outputSchemas['customFieldSet'],
  props: {
    objectType: aiProps.objectType({ options: CUSTOM_FIELD_OBJECT_OPTIONS, description: 'Type of the record.' }),
    recordId: Property.Number({ displayName: 'Record ID', required: true }),
    fieldName: Property.ShortText({ displayName: 'Field Name', description: 'API name, e.g. Industry__c', required: true }),
    value: Property.ShortText({ displayName: 'Value', required: true }),
  },
  async run({ auth, propsValue }) {
    const objectName = insightlyCommon.ensureObject(propsValue.objectType);
    const recordId = insightlyUtils.toId({ value: propsValue.recordId, label: 'Record ID' });
    const fieldName = insightlyUtils.optionalText(propsValue.fieldName);
    if (!fieldName) {
      throw new Error('Field Name is required.');
    }
    const connection = await insightlyCommon.connect({ auth });
    const definitions = insightlyUtils.toRecords(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/CustomFields/${objectName}` }));
    const validNames = definitions.flatMap((definition) => {
      const name = insightlyUtils.readString(definition['FIELD_NAME']);
      return name === null ? [] : [name];
    });
    const match = validNames.find((name) => name.toLowerCase() === fieldName.toLowerCase());
    if (!match) {
      throw new InsightlyError({
        message: validNames.length === 0 ? `${objectName} has no custom fields.` : `Unknown custom field "${fieldName}" for ${objectName}. Valid fields: ${validNames.join(', ')}`,
        status: 400,
      });
    }
    await insightlyCommon.call({
      connection,
      method: HttpMethod.PUT,
      path: `/${objectName}`,
      body: { [insightlyCommon.idKeyFor(objectName)]: recordId, CUSTOMFIELDS: [{ FIELD_NAME: match, FIELD_VALUE: propsValue.value }] },
    });
    return { id: recordId, fieldName: match, value: propsValue.value };
  },
});
