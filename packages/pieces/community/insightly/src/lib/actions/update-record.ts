import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { outputSchemas } from '../common/output-schemas';
import { fieldsByObject } from '../common/props';

export const updateRecord = createAction({
  auth: insightlyAuth,
  name: 'update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: "Update an existing record's fields in a specified Insightly object. Only the fields you fill in are changed.",
  audience: 'human',
  outputSchema: outputSchemas['updatedRecord'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of object that contains the record you want to update',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
    recordId: insightlyDropdowns.recordDropdown({ displayName: 'Record ID', description: 'Select the record to update' }),
    fields: Property.DynamicProperties({
      auth: insightlyAuth,
      displayName: 'Fields',
      description: 'The new field values. Empty fields are left unchanged.',
      required: true,
      refreshers: ['objectName'],
      props: async ({ objectName }) => {
        const fields = typeof objectName === 'string' ? fieldsByObject[objectName] : undefined;
        if (!fields) {
          return {};
        }
        return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, { ...field, required: false }]));
      },
    }),
  },
  async run(context) {
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const recordId = insightlyUtils.toId({ value: context.propsValue.recordId, label: 'Record ID' });
    const changes = insightlyUtils.compact({ ...context.propsValue.fields });
    if (Object.keys(changes).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    const idKey = insightlyCommon.idKeyFor(objectName);
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({ connection, method: HttpMethod.PUT, path: `/${objectName}`, body: { ...changes, [idKey]: recordId } }),
    );
    return { success: true, id: recordId, objectType: objectName, ...record };
  },
});
