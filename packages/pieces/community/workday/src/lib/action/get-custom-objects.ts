import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayGetCustomObject } from '../common';
import { flattenRecord } from '../common/fields';
import { customObjectDefinitionProperty } from '../common/props';

export const getCustomObjects = createAction({
	auth: workdayAuth,
	name: 'get_custom_objects',
	displayName: 'Get Custom Objects',
	description: 'Retrieves a custom object instance by definition ID and object ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Retrieves a single instance of a tenant-defined Workday custom object, addressed by its custom object definition ID plus the instance ID. Use when both IDs are known; call List Custom Object Definitions (Batch) first to discover the definition ID, and use Get Business Object Details (Batch) for standard objects such as workers or job requisitions. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		definitionId: customObjectDefinitionProperty,
		objectId: Property.ShortText({
			displayName: 'Custom Object ID',
			description: 'ID of the custom object instance.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const result = await workdayGetCustomObject(
			auth,
			propsValue.definitionId,
			propsValue.objectId,
		);
		return flattenRecord(result);
	},
});
