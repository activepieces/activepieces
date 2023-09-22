import { Property, createAction } from '@activepieces/pieces-framework';
import {
  createBulkJob,
  getBulkJobInfo,
  notifyBulkJobComplete,
  salesforcesCommon,
  uploadToBulkJob,
} from '../common';

import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const upsertByExternalIdBulk = createAction({
  auth: salesforceAuth,
  name: 'upsert_by_external_id_bulk',
  displayName: 'Bulk Upsert (Advanced)',
  description: 'Bulk upsert a record by external id',
  props: {
    object: salesforcesCommon.object,
    external_field: Property.ShortText({
      displayName: 'External Field',
      description: 'Select the External Field',
      required: true,
    }),
    records: Property.LongText({
      displayName: 'Records',
      description: 'Select the Records (CSV format)',
      required: true,
    }),
  },
  async run(context) {
    const records = context.propsValue.records;
    let jobId;
    if (!records) {
      throw new Error('Expect CSV of records to upsert');
    }
    const { object, external_field } = context.propsValue;

    // create bulk job
    const create = await createBulkJob(HttpMethod.POST, context.auth, {
      object: object,
      externalIdFieldName: external_field,
      contentType: 'CSV',
      operation: 'upsert',
      lineEnding: 'CRLF',
    });
    if (create.status == 200) {
      jobId = create.body.id;
    } else {
      throw new Error(`job creation failed: ${JSON.stringify(create)}`);
    }
    // upload records to bulk job
    await uploadToBulkJob(HttpMethod.PUT, context.auth, jobId, records).catch(
      (e) => {
        throw new Error(`job upload failed: ${JSON.stringify(e)}`);
      }
    );

    // notify upload complete
    await notifyBulkJobComplete(
      HttpMethod.PATCH,
      context.auth,
      { state: 'UploadComplete' },
      jobId
    ).catch((e) => {
      throw new Error(`job failed: ${JSON.stringify(e)}`);
    });

    const response = await getBulkJobInfo(
      HttpMethod.GET,
      context.auth,
      jobId
    ).catch((e) => {
      throw new Error(`job failed: ${JSON.stringify(e)}`);
    });
    return response;
  },
});
