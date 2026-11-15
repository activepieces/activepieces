import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import { airparserClient, airparserOutputSchemas, isRecord, pathFor, requireId, vendorMessage } from '../../common';

export const upsertExtractionSchemaAiAction = createAction({
	auth: airparserAuth,
	name: 'upsert_extraction_schema',
	classification: 'WRITE',
	displayName: 'Set Extraction Schema',
	description: 'Replace the extraction schema of an inbox.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates or replaces the extraction schema of an Airparser inbox: the full list of fields to extract from future documents. Send every field you want to keep; fields left out are removed. Each field is {"type":"scalar|list|object|enum","data":{...}}, e.g. {"type":"scalar","data":{"name":"total","description":"Invoice total","type":"decimal","default_value":""}}. Use Get Inbox first to read the current schema. Idempotent: the same fields give the same schema.',
		idempotent: true,
	},
	outputSchema: airparserOutputSchemas.upsertSchema,
	props: {
		inboxId: Property.ShortText({ displayName: 'Inbox ID', description: 'The inbox ID, from List Inboxes.', required: true }),
		fields: Property.LongText({
			displayName: 'Fields JSON',
			description:
				'JSON array, e.g. [{"type":"scalar","data":{"name":"total","type":"string"}}]. Types: scalar, list, object, enum. Replaces the whole schema.',
			required: true,
		}),
	},
	async run(context) {
		const inboxId = requireId({ value: context.propsValue.inboxId, label: 'Inbox ID' });
		const fields = parseFields(context.propsValue.fields);
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/inboxes${pathFor([inboxId])}/schema`,
			operation: 'update extraction schema',
			body: { fields },
		});
		if (response === false || response === 'false') {
			throw new Error(`Airparser did not update the extraction schema: ${vendorMessage(response)}`);
		}
		return { success: true, inbox_id: inboxId, field_count: fields.length };
	},
});

function parseFields(value: unknown): Record<string, unknown>[] {
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			throw new Error('Fields JSON must be a valid JSON array of field definitions.');
		}
	}
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Fields JSON must be a non-empty JSON array of field definitions.');
	}
	return parsed.map((field, index) => {
		if (!isRecord(field) || typeof field['type'] !== 'string' || !FIELD_TYPES.includes(field['type']) || !isRecord(field['data'])) {
			throw new Error(`Field ${index + 1} must look like {"type":"scalar|list|object|enum","data":{"name":"..."}}.`);
		}
		return field;
	});
}

const FIELD_TYPES = ['scalar', 'list', 'object', 'enum'];
