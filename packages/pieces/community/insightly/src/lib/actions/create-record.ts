import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { outputSchemas } from '../common/output-schemas';
import { fieldsByObject } from '../common/props';

export const createRecord = createAction({
  auth: insightlyAuth,
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Create a new record in a specified Insightly object (Contact, Lead, Opportunity, etc.)',
  audience: 'human',
  outputSchema: outputSchemas['createdRecord'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of record to create',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
    fields: Property.DynamicProperties({
      auth: insightlyAuth,
      displayName: 'Fields',
      required: true,
      refreshers: ['objectName'],
      props: async ({ objectName }) => (typeof objectName === 'string' ? fieldsByObject[objectName] ?? {} : {}),
    }),
  },
  async run(context) {
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const recordData = insightlyUtils.compact({ ...context.propsValue.fields });
    if (Object.keys(recordData).length === 0) {
      throw new Error('Field values must be provided to create the record');
    }
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({ connection, method: HttpMethod.POST, path: `/${objectName}`, body: recordData }),
    );
    const recordId = insightlyUtils.readNumber(record[insightlyCommon.idKeyFor(objectName)]);
    return { success: true, recordId, id: recordId, objectType: objectName, ...record };
  },
});
