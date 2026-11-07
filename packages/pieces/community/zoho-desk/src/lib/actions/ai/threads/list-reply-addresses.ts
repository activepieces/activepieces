import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListReplyAddressesOutputSchema } from '../../../output-schemas';

export const zohoDeskListReplyAddressesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_reply_addresses',
	outputSchema: zohoDeskListReplyAddressesOutputSchema,
	displayName: 'List Reply Addresses',
	description: 'Lists the From addresses a department can send email from.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the From email addresses configured for one department. Send Ticket Reply and Create Draft Reply need one of these as From Address; prefer a verified, active one.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		isActive: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Active Only',
			description: 'Yes returns only active addresses.',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, isActive, from, limit } = context.propsValue;
		const addresses = await zohoDeskApi.listReplyAddresses({
			auth: context.auth,
			orgId,
			departmentId,
			isActive,
			from,
			limit,
		});
		return { addresses, count: addresses.length };
	},
});
