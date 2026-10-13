import { createAction } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsListPagesOutputSchema } from '../../output-schemas';

export const listPagesAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_list_pages',
	outputSchema: facebookLeadsListPagesOutputSchema,
	displayName: 'List Pages',
	description: 'Lists the Facebook Pages the connected user manages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Facebook Page the connected user manages, with its id, name, category and the tasks the user may perform on it. Use it to find the Page ID that List Lead Forms and Create Lead Form need.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const pages = await facebookLeadsApi.listPages({ accessToken: context.auth.access_token });
		return {
			pages: pages.map((page) => ({
				id: page.id,
				name: page.name,
				category: page.category ?? null,
				tasks: page.tasks ?? [],
			})),
			count: pages.length,
		};
	},
});
