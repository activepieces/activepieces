import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const subscribeContactAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_subscribe_contact',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Subscribe Contact',
	description: 'Adds a contact to a mailing list, or updates the contact if it exists.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a contact to a mailing list (key from List Mailing Lists), or updates the contact matched by email, setting standard fields and any field from List Contact Fields via Additional Fields. New contacts get a confirmation email and join the list only after they confirm; use Add Contacts to Mailing List to add contacts without confirmation. Idempotent upsert keyed on email.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		email: zohoCampaignsAiProps.contactEmail({ required: true }),
		firstName: Property.ShortText({ displayName: 'First Name', required: false }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', required: false }),
		companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
		additionalFields: Property.Json({
			displayName: 'Additional Fields',
			description:
				'Other contact fields keyed by display name from List Contact Fields, e.g. {"City": "Austin"}. The dedicated props above win over keys here.',
			required: false,
		}),
		source: Property.ShortText({
			displayName: 'Source',
			description: 'Where the contact came from, stored as the contact source.',
			required: false,
		}),
		topicId: zohoCampaignsAiProps.topicId({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.addUpdateContact({
			auth,
			listkey: propsValue.listKey,
			contactinfo: zohoCampaignsUtils.contactInfo({
				email: propsValue.email,
				firstName: propsValue.firstName,
				lastName: propsValue.lastName,
				phone: propsValue.phone,
				companyName: propsValue.companyName,
				additionalFields: propsValue.additionalFields,
			}),
			source: propsValue.source,
			topic_id: propsValue.topicId,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
