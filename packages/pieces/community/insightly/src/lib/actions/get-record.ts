import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { outputSchemas } from '../common/output-schemas';

export const getRecord = createAction({
  auth: insightlyAuth,
  name: 'get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Retrieve a record from a specified Insightly object by its ID',
  audience: 'human',
  outputSchema: outputSchemas['genericRecord'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of object to retrieve',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
    recordId: insightlyDropdowns.recordDropdown({ displayName: 'Record ID', description: 'Select the record to retrieve' }),
  },
  async run(context) {
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const recordId = insightlyUtils.toId({ value: context.propsValue.recordId, label: 'Record ID' });
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/${objectName}/${recordId}` }),
    );
    return { ...record, id: recordId, objectType: objectName };
  },
});
