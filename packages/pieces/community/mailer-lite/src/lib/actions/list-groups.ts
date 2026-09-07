import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { listGroupsOutputSchema } from '../output-schemas';

export const listGroupsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_groups',
	classification: 'READ',
	displayName: 'List Groups',
	description: 'List groups in the account, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists MailerLite groups with their subscriber counts and engagement stats. Use this to discover which groups exist before assigning a subscriber, or to report on list sizes. Returns one page at a time: read `meta.last_page` and `meta.total` from the response and call again with an increased Page to walk an account that has more groups than the chosen Limit. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: listGroupsOutputSchema,
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Groups to return per page (1-1000, default 100).',
			required: false,
			defaultValue: 100,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1. Use `meta.last_page` from a previous response to know when to stop.',
			required: false,
			defaultValue: 1,
		}),
	},
	async run(context) {
		const { limit, page } = context.propsValue;

		const resolvedLimit = Math.trunc(Number(limit ?? 100));
		if (!Number.isFinite(resolvedLimit) || resolvedLimit < 1 || resolvedLimit > 1000) {
			throw new Error('Limit must be between 1 and 1000.');
		}

		const resolvedPage = Math.trunc(Number(page ?? 1));
		if (!Number.isFinite(resolvedPage) || resolvedPage < 1) {
			throw new Error('Page must be 1 or greater.');
		}

		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.get({
			limit: resolvedLimit,
			page: resolvedPage,
			sort: 'name',
		});
		return response.data;
	},
});
