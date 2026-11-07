import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyCallsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_calls',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Update Many Calls',
	description: 'Sets one field to the same value on several calls.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Sets one field (by API name) to the same value on several calls at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callIds: Property.Array({
			displayName: 'Call IDs',
			description: 'Call IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set (from List Fields, module calls).',
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
		const { orgId, callIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		return await zohoDeskApi.updateManyCalls({
			auth: context.auth,
			orgId,
			callIds: zohoDeskUtils.requiredStringList({ value: callIds, propName: 'Call IDs' }),
			fieldName,
			fieldValue,
			isCustomField,
		});
	},
});
