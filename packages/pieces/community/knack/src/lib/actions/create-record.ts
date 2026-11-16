import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  knackGetObject,
  knackTransformFields,
  objectDropdown,
  recordFields,
} from '../common/props';
import { humanRecordOutputSchema } from '../common/schemas';

export const createRecordAction = createAction({
  auth: knackAuth,
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record into a specified object/table.',
  audience: 'human',
  outputSchema: humanRecordOutputSchema,
  props: {
    object: objectDropdown,
    recordFields: recordFields,
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordFields: recordData } = propsValue;
    const response = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.POST,
      auth,
      resourceUri: `/objects/${encodeURIComponent(objectKey)}/records`,
      body: recordData,
    });
    const objectDetails = await knackGetObject({ auth, objectKey });
    return knackTransformFields(objectDetails, response);
  },
});
