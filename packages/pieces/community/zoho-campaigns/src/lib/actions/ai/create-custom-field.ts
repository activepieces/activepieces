import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCreateCustomFieldOutputSchema } from '../../output-schemas';

const FIELD_TYPES = [
	'Text',
	'Integer',
	'Phone',
	'Date',
	'Picklist',
	'Email',
	'Checkbox',
	'LongInteger',
	'URL',
	'textarea',
	'RadioOption',
	'Multiselect',
	'DateTime',
	'Decimal',
	'Percent',
];

export const createCustomFieldAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_create_custom_field',
	outputSchema: zohoCampaignsCreateCustomFieldOutputSchema,
	displayName: 'Create Custom Field',
	description: 'Creates a custom contact field.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a custom contact field of the given type, so contacts can store a new attribute through Subscribe Contact. Check List Contact Fields first: a duplicate name fails. Not idempotent, and fields cannot be deleted through the API.',
		idempotent: false,
	},
	props: {
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'Alphanumeric name of the field.',
			required: true,
		}),
		fieldType: Property.StaticDropdown({
			displayName: 'Field Type',
			description: 'Data type of the field.',
			required: true,
			options: {
				disabled: false,
				options: FIELD_TYPES.map((type) => ({ label: type, value: type })),
			},
		}),
		fieldLength: Property.Number({
			displayName: 'Field Length',
			description: 'Maximum length of the value. Defaults to 20.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.createCustomField({
			auth,
			fieldname: propsValue.fieldName,
			fieldtype: propsValue.fieldType,
			fieldlength: propsValue.fieldLength,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
