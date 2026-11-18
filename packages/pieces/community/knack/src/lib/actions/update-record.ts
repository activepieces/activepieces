import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { assertKnackRecordFound, knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  knackGetObject,
  knackTransformFields,
  objectDropdown,
  recordFields,
} from '../common/props';
import { humanRecordOutputSchema } from '../common/schemas';

export const updateRecordAction = createAction({
  auth: knackAuth,
  name: 'update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
  audience: 'human',
  outputSchema: humanRecordOutputSchema,
  props: {
    object: objectDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The ID of the record to update.',
    }),
    recordFields: recordFields,
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordId, recordFields } = propsValue;
    const response = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.PUT,
      auth,
      resourceUri: `/objects/${encodeURIComponent(objectKey)}/records/${encodeURIComponent(recordId.trim())}`,
      body: recordFields,
    });
    assertKnackRecordFound({ record: response, recordId: recordId.trim(), objectKey });
    const objectDetails = await knackGetObject({ auth, objectKey });
    return knackTransformFields(objectDetails, response);
  },
});
