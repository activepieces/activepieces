import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateAccountAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_account',
	outputSchema: zohoDeskGetAccountOutputSchema,
	displayName: 'Update Account',
	description: 'Updates fields on an account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one account; fields left empty are not changed.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		accountName: Property.ShortText({
			displayName: 'Account Name',
			description: 'Account (company) name.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Account email.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		website: Property.ShortText({
			displayName: 'Website',
			description: 'Website URL.',
			required: false,
		}),
		industry: Property.ShortText({
			displayName: 'Industry',
			description: 'Industry.',
			required: false,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns the account (from List Agents).',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Notes about the account.',
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
		code: Property.ShortText({
			displayName: 'Postal Code',
			description: 'Postal code.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name (from List Fields, module accounts).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			accountId,
			accountName,
			email,
			phone,
			website,
			industry,
			ownerId,
			description,
			street,
			city,
			state,
			code,
			country,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.updateAccount({
			auth: context.auth,
			orgId,
			accountId,
			accountName,
			email,
			phone,
			website,
			industry,
			ownerId,
			description,
			street,
			city,
			state,
			code,
			country,
			customFields,
		});
	},
});
