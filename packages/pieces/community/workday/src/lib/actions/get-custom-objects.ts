import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const getCustomObjectsAction = createAction({
	auth: workdayAuth,
	name: 'get_custom_objects',
	classification: 'READ',
	displayName: 'Get Custom Objects',
	description:
		'Retrieves a custom object record by its record ID or, for single-instance objects, by the parent record ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Retrieves one record of a tenant-defined Workday custom object, addressed by the definition alias plus either the record ID or, for a single-instance object, the ID of the record it is attached to (e.g. the worker WID). Call List Custom Object Definitions (Batch) first to discover the alias, and use Get Business Object Details (Batch) for standard objects such as workers or job requisitions. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		definitionId: workdayProps.customObjectDefinition({ required: true }),
		objectId: Property.ShortText({
			displayName: 'Record ID',
			description:
				'The custom object record ID, or for a single-instance object the ID of the record it is attached to (e.g. the worker WID).',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const result = await workdayApi.getCustomObject({
			auth,
			alias: propsValue.definitionId,
			objectId: propsValue.objectId,
		});
		return workdayUtils.flattenRecord({ value: result });
	},
});
