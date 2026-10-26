import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingUrlDomainsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_url_domains',
	displayName: 'List Messaging URL Domains',
	description: 'Lists the URL domains registered for link shortening in messages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of messaging URL domains on the account (the domains used to shorten and track links in messages), with their id and use case.',
		idempotent: true,
	},
	props: {
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingUrlDomains({
			auth: context.auth,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
