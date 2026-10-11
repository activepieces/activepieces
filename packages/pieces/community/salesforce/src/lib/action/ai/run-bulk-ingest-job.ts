import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { bulkUtils } from '../../common/bulk';
import { bulkJobCreatedOutputSchema } from '../../output-schemas';

export const runBulkIngestJob = createAction({
	auth: salesforceAuth,
	name: 'run_bulk_ingest_job',
	classification: 'WRITE',
	displayName: 'Run Bulk Ingest Job',
	description: 'Start a Bulk API 2.0 job that inserts, updates, upserts or deletes records from CSV.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Bulk API 2.0 ingest job, uploads the CSV and queues it for processing in one call, returning the job id right away while Salesforce works asynchronously. Poll Get Bulk Ingest Job until the state is JobComplete, Failed or Aborted, then read per-row outcomes with Get Bulk Ingest Results. Use it for thousands of rows; the CSV header must be field API names (Id for update/delete), and upsert needs an external id field. Not idempotent: rerunning inserts again.',
		idempotent: false,
	},
	outputSchema: bulkJobCreatedOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or My_Object__c.',
			required: true,
		}),
		operation: Property.StaticDropdown({
			displayName: 'Operation',
			required: true,
			options: {
				options: [
					{ label: 'Insert', value: 'insert' },
					{ label: 'Update', value: 'update' },
					{ label: 'Upsert', value: 'upsert' },
					{ label: 'Delete', value: 'delete' },
				],
			},
		}),
		external_id_field: Property.ShortText({
			displayName: 'External ID Field',
			description: 'Field API name to match on. Required for upsert.',
			required: false,
		}),
		csv: Property.LongText({
			displayName: 'CSV',
			description: 'Records as CSV with a header row of field API names, lines separated by LF.',
			required: true,
		}),
	},
	async run(context) {
		const { operation, csv } = context.propsValue;
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const externalIdField = context.propsValue.external_id_field?.trim()
			? salesforceUtils.assertApiName({ value: context.propsValue.external_id_field, fieldName: 'External ID Field' })
			: undefined;
		if (operation === 'upsert' && !externalIdField) {
			throw new Error('External ID Field is required for upsert.');
		}
		if (!csv.trim()) {
			throw new Error('CSV must not be empty.');
		}
		const created = await callSalesforceApi<{ id: string }>(HttpMethod.POST, context.auth, `${bulkUtils.BULK_API_PATH}/ingest`, {
			object,
			operation,
			contentType: 'CSV',
			lineEnding: 'LF',
			...(externalIdField ? { externalIdFieldName: externalIdField } : {}),
		});
		const jobId = created.body.id;
		const jobPath = `${bulkUtils.BULK_API_PATH}/ingest/${jobId}`;
		try {
			await callSalesforceApi(HttpMethod.PUT, context.auth, `${jobPath}/batches`, csv.replace(/\r\n/g, '\n'), {
				headers: { 'Content-Type': 'text/csv' },
			});
		} catch (error) {
			await callSalesforceApi(HttpMethod.PATCH, context.auth, jobPath, { state: 'Aborted' }).catch(() => undefined);
			throw new Error(`CSV upload failed, job ${jobId} was aborted: ${error instanceof Error ? error.message : String(error)}`);
		}
		const closed = await callSalesforceApi<{ state?: string }>(HttpMethod.PATCH, context.auth, jobPath, {
			state: 'UploadComplete',
		});
		return {
			job_id: jobId,
			state: closed.body?.state ?? 'UploadComplete',
			object,
			operation,
		};
	},
});
