import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_contacts',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Update Many Contacts',
	description: 'Sets one field to the same value on several contacts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Sets one field (by API name) to the same value on several contacts at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'Contact IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set (from List Fields, module contacts).',
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
		const { orgId, contactIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		return await zohoDeskApi.updateManyContacts({
			auth: context.auth,
			orgId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
			fieldName,
			fieldValue,
			isCustomField,
		});
	},
});
