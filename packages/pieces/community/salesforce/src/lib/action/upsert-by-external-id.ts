import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const upsertByExternalId = createAction({
  auth: salesforceAuth,
  name: 'upsert_by_external_id',
  displayName: 'Batch Upsert (Advanced)',
  description: 'Batch upsert a record by external id',
  audience: 'both',
  aiMetadata: { description: 'Insert-or-update a small batch of records via the composite API, matching on a stable external-ID field and accepting JSON input. Idempotent on the external ID — rerunning with the same data updates rather than duplicates. Use Bulk Upsert for large CSV loads.', idempotent: true },
  props: {
    object: salesforcesCommon.object,
    external_field: Property.ShortText({
      displayName: 'External Field',
      description: 'Select the External Field',
      required: true,
    }),
    records: Property.Json({
      displayName: 'Records',
      description: 'Select the Records',
      required: true,
      defaultValue: {
        records: [],
      },
    }),
  },
  async run(context) {
    const records = context.propsValue?.records?.records;
    if (!records) {
      throw new Error(
        'Expect records field inside json to be an array with records to upsert'
      );
    }
    const { object, external_field } = context.propsValue;
    const response = await callSalesforceApi(
      HttpMethod.PATCH,
      context.auth,
      `/services/data/v55.0/composite/sobjects/${object}/${external_field}`,
      {
        allOrNone: false,
        ...context.propsValue.records,
      }
    );
    return response;
  },
});
