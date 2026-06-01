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
