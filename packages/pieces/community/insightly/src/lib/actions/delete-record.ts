import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { outputSchemas } from '../common/output-schemas';

export const deleteRecord = createAction({
  auth: insightlyAuth,
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Delete a record from a specified Insightly object',
  audience: 'human',
  outputSchema: outputSchemas['deletedRecord'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of object to delete from',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
    recordId: insightlyDropdowns.recordDropdown({ displayName: 'Record ID', description: 'Select the record to delete' }),
  },
  async run(context) {
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const recordId = insightlyUtils.toId({ value: context.propsValue.recordId, label: 'Record ID' });
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    await insightlyCommon.call({ connection, method: HttpMethod.DELETE, path: `/${objectName}/${recordId}` });
    return {
      success: true,
      id: recordId,
      objectType: objectName,
      message: `Record ${recordId} successfully deleted from ${objectName}`,
    };
  },
});
