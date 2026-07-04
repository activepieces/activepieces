import { createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayListCustomObjectDefinitions } from '../common';
import { flattenRecord } from '../common/fields';

export const listCustomObjectDefinitionsBatch = createAction({
	auth: workdayAuth,
	name: 'list_custom_object_definitions_batch',
	displayName: 'List Custom Object Definitions (Batch)',
	description:
		'Lists all custom object definitions available in your Workday tenant.',
	props: {},
	async run({ auth }) {
		const definitions = await workdayListCustomObjectDefinitions(auth);
		const flattened = definitions.map((item) => flattenRecord(item));
		return {
			total_count: flattened.length,
			definitions: flattened,
		};
	},
});
