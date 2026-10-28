import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskMergeContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateContactAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_contact',
	outputSchema: zohoDeskMergeContactsOutputSchema,
	displayName: 'Update Contact',
	description: 'Updates fields on a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one contact; fields left empty are not changed.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Last name.',
			required: false,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'First name.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Primary email.',
			required: false,
		}),
		secondaryEmail: Property.ShortText({
			displayName: 'Secondary Email',
			description: 'Secondary email.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		mobile: Property.ShortText({
			displayName: 'Mobile',
			description: 'Mobile number.',
			required: false,
		}),
		accountId: zohoDeskAiProps.accountId({
			required: false,
			description: 'Account the contact belongs to (from Search Accounts).',
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns the contact (from List Agents).',
			required: false,
		}),
		title: Property.ShortText({ displayName: 'Title', description: 'Job title.', required: false }),
		type: Property.ShortText({
			displayName: 'Type',
			description: 'Contact type.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Notes about the contact.',
			required: false,
		}),
		street: Property.ShortText({
			displayName: 'Street',
			description: 'Street address.',
			required: false,
		}),
		city: Property.ShortText({ displayName: 'City', description: 'City.', required: false }),
		state: Property.ShortText({
			displayName: 'State',
			description: 'State or region.',
			required: false,
		}),
		zip: Property.ShortText({ displayName: 'Zip', description: 'Postal code.', required: false }),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country.',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Preferred language, e.g. "English".',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name (from List Fields, module contacts).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			contactId,
			lastName,
			firstName,
			email,
			secondaryEmail,
			phone,
			mobile,
			accountId,
			ownerId,
			title,
			type,
			description,
			street,
			city,
			state,
			zip,
			country,
			language,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.updateContact({
			auth: context.auth,
			orgId,
			contactId,
			lastName,
			firstName,
			email,
			secondaryEmail,
			phone,
			mobile,
			accountId,
			ownerId,
			title,
			type,
			description,
			street,
			city,
			state,
			zip,
			country,
			language,
			customFields,
		});
	},
});
