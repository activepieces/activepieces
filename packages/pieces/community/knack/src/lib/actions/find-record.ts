import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  fieldIdDropdown,
  knackGetObject,
  knackTransformFields,
  objectDropdown,
} from '../common/props';
import { findRecordOutputSchema } from '../common/schemas';

export const findRecordAction = createAction({
  auth: knackAuth,
  name: 'find_record',
  classification: 'SEARCH',
  displayName: 'Find Record',
  description: 'Finds a single record using field value.',
  audience: 'human',
  outputSchema: findRecordOutputSchema,
  props: {
    object: objectDropdown,
    fieldId: fieldIdDropdown,
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      required: true,
      description: 'The value to search for in the specified field.',
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, fieldId, fieldValue } = propsValue;
    const response = await knackApiCall<{ records?: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      auth,
      resourceUri: `/objects/${encodeURIComponent(objectKey)}/records`,
      query: {
        filters: JSON.stringify({
          match: 'and',
          rules: [{ field: fieldId, operator: 'is', value: fieldValue }],
        }),
        rows_per_page: 1,
      },
    });

    const first = response.records?.[0];
    if (first) {
      const objectDetails = await knackGetObject({ auth, objectKey });
      return {
        found: true,
        record: knackTransformFields(objectDetails, first),
      };
    }
    return {
      found: false,
      record: null,
      message: 'No record found matching the provided filters.',
    };
  },
});
