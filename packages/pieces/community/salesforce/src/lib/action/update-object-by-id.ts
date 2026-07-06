import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const UpdateObjectById = createAction({
  auth: salesforceAuth,

  name: 'update_object_by_id',
  displayName: 'Update Object (Advanced)',
  description: 'Update object by Id',
  audience: 'both',
  aiMetadata: { description: 'Advanced update: patch any Salesforce object record by its ID using a raw JSON field map, for objects without a dedicated update action. Use Update Record for the standard object/record/data form; only the supplied fields change and the record must already exist.', idempotent: false },
  props: {
    object: salesforcesCommon.object,
    id: Property.ShortText({
      displayName: 'Id',
      description: 'Select the Id',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Data',
      description: 'Select mapped object',
      required: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { object, id, data } = context.propsValue;
    const response = await callSalesforceApi(
      HttpMethod.PATCH,
      context.auth,
      `/services/data/v56.0/sobjects/${object}/${id}`,
      {
        ...data,
      }
    );
    return response;
  },
});
