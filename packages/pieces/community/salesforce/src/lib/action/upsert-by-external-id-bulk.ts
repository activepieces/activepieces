import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  createBulkJob,
  getBulkJobInfo,
  notifyBulkJobComplete,
  salesforcesCommon,
  uploadToBulkJob,
} from '../common';

import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { upsertByExternalIdBulkOutputSchema } from '../output-schemas';

export const upsertByExternalIdBulk = createAction({
  auth: salesforceAuth,
  name: 'upsert_by_external_id_bulk',
  classification: 'WRITE',
  displayName: 'Bulk Upsert',
  description: 'Creates or updates records from a CSV with a Bulk API job.',
  audience: 'both',
  aiMetadata: { description: 'Insert-or-update many records at once via the Bulk API, matching on a stable external-ID field and accepting CSV input. Idempotent on the external ID — rerunning with the same data does not create duplicates. Pick this for large batches; use Batch Upsert for small JSON payloads.', idempotent: true },
  outputSchema: upsertByExternalIdBulkOutputSchema,
  props: {
    job_info: Property.MarkDown({
      value:
        'Salesforce finishes the job after this step. The output is the job, not its results.',
      variant: MarkdownVariant.INFO,
    }),
    object: salesforcesCommon.object,
    external_field: Property.ShortText({
      displayName: 'External ID Field',
      description: 'API name of the external ID field to match records on.',
      placeholder: 'External_Id__c',
      required: true,
    }),
    records: Property.LongText({
      displayName: 'Records',
      description: 'CSV with a header row of field API names.',
      placeholder: 'External_Id__c,Name',
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
