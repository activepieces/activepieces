import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const createUpdateCustomObjectAction = createAction({
	auth: workdayAuth,
	name: 'create_update_custom_object',
	classification: 'WRITE',
	displayName: 'Create/Update Custom Object',
	description: 'Creates or updates a Workday custom object record.',
	audience: 'both',
	aiMetadata: {
		description:
			'Writes a record of a tenant-defined Workday custom object, chosen by its definition alias, with the field values supplied as a JSON body keyed by field alias. Without a record ID the body must name the record it is attached to, e.g. `{ "worker": { "id": "<worker WID>" }, "note": "..." }`; a single-instance object that already has a record is updated instead of duplicated. With a record ID only the given fields of that record are updated. Call List Custom Object Definitions (Batch) first when the alias is unknown. Not idempotent for multi-instance objects: with no record ID every call creates another record.',
		idempotent: false,
	},
	props: {
		definitionId: workdayProps.customObjectDefinition({ required: true }),
		objectId: Property.ShortText({
			displayName: 'Record ID',
			description:
				'Record ID to update. Leave blank to create; the body must then reference the record it is attached to, e.g. `{ "worker": { "id": "..." } }`.',
			required: false,
		}),
		body: workdayProps.requestBody({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body: Record<string, unknown> =
			typeof propsValue.body === 'string' ? JSON.parse(propsValue.body) : { ...propsValue.body };
		const result = await workdayApi.upsertCustomObject({
			auth,
			alias: propsValue.definitionId,
			objectId: propsValue.objectId,
			body,
		});
		return workdayUtils.flattenRecord({ value: result });
	},
});
