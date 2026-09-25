import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { upsertRecordByExternalIdOutputSchema } from '../../output-schemas';

export const upsertRecordByExternalId = createAction({
	auth: salesforceAuth,
	name: 'upsert_record_by_external_id',
	classification: 'WRITE',
	displayName: 'Upsert Record by External ID',
	description: 'Create or update one record matched on an external id field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates or updates a single Salesforce record matched on an external id field: updates the match if one exists, otherwise creates it, and reports which happened. Use it to sync from another system without duplicates; for up to 200 records use Upsert Records Batch, and to update by Salesforce id use Update Record. Do not include the external id field inside Fields. Idempotent on the external id: rerunning updates rather than duplicates.',
		idempotent: true,
	},
	outputSchema: upsertRecordByExternalIdOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or My_Object__c.',
			required: true,
		}),
		external_id_field: Property.ShortText({
			displayName: 'External ID Field',
			description: 'API name of the external id field, e.g. My_Ext_Id__c.',
			required: true,
		}),
		external_id_value: Property.ShortText({
			displayName: 'External ID Value',
			required: true,
		}),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object of field API names to values to set on the record.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const externalField = salesforceUtils.assertApiName({
			value: context.propsValue.external_id_field,
			fieldName: 'External ID Field',
		});
		const value = context.propsValue.external_id_value.trim();
		if (value.length === 0) {
			throw new Error('External ID Value is required.');
		}
		const fields = salesforceUtils.parseJsonObject({ value: context.propsValue.fields, fieldName: 'Fields' }) ?? {};
		const fieldNames = Object.keys(fields);
		if (fieldNames.length === 0) {
			throw new Error('Fields must contain at least one field.');
		}
		const response = await callSalesforceApi<{ id?: string; success?: boolean; created?: boolean } | string>(
			HttpMethod.PATCH,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${externalField}/${encodeURIComponent(value)}`,
			fields
		);
		const body = salesforceUtils.isRecord(response.body) ? response.body : {};
		const id =
			typeof body['id'] === 'string'
				? body['id']
				: await resolveRecordId({ auth: context.auth, object, externalField, value });
		return {
			id,
			success: true,
			created: response.status === 201,
			external_id_field: externalField,
			external_id_value: value,
			updated_fields: fieldNames,
		};
	},
});

async function resolveRecordId({ auth, object, externalField, value }: { auth: OAuth2PropertyValue; object: string; externalField: string; value: string }): Promise<string | null> {
	if (externalField === 'Id') {
		return value;
	}
	const response = await callSalesforceApi<{ Id?: string }>(
		HttpMethod.GET,
		auth,
		`/services/data/v56.0/sobjects/${object}/${externalField}/${encodeURIComponent(value)}?fields=Id`,
		undefined
	);
	return response.body.Id ?? null;
}
