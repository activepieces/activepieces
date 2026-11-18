import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_tasks',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Update Many Tasks',
	description: 'Sets one field to the same value on several tasks.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets one field (by API name, e.g. "status") to the same value on several tasks at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskIds: Property.Array({
			displayName: 'Task IDs',
			description: 'Task IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set (from List Fields, module tasks).',
			required: true,
		}),
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			description: 'Value to set. Leave empty to clear the field.',
			required: false,
		}),
		isCustomField: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Custom Field',
			description: 'Yes when Field Name is a custom field.',
		}),
	},
	async run(context) {
		const { orgId, taskIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		return await zohoDeskApi.updateManyTasks({
			auth: context.auth,
			orgId,
			taskIds: zohoDeskUtils.requiredStringList({ value: taskIds, propName: 'Task IDs' }),
			fieldName,
			fieldValue,
			isCustomField,
		});
	},
});
