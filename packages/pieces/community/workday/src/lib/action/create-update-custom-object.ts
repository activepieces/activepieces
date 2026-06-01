import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayUpsertCustomObject } from '../common';
import { flattenRecord } from '../common/fields';
import { customObjectDefinitionProperty, requestBodyProperty } from '../common/props';

export const createUpdateCustomObject = createAction({
	auth: workdayAuth,
	name: 'create_update_custom_object',
	displayName: 'Create/Update Custom Object',
	description: 'Creates or updates a Workday custom object instance (PUT upsert).',
	props: {
		definitionId: customObjectDefinitionProperty,
		objectId: Property.ShortText({
			displayName: 'Custom Object ID',
			description:
				'Optional ID for update. Leave blank to create a new custom object.',
			required: false,
		}),
		body: requestBodyProperty,
	},
	async run({ auth, propsValue }) {
		const body: Record<string, unknown> =
			typeof propsValue.body === 'string'
				? JSON.parse(propsValue.body)
				: { ...(propsValue.body as Record<string, unknown>) };
		if (propsValue.objectId) {
			body['id'] = propsValue.objectId;
		}
		const result = await workdayUpsertCustomObject(
			auth,
			propsValue.definitionId,
			body,
		);
		return flattenRecord(result);
	},
});
