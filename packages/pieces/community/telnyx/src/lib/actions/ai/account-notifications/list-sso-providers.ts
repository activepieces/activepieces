import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListSsoProvidersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_sso_providers',
	displayName: 'List SSO Providers',
	description: 'Lists the SSO authentication providers of the organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of SSO authentication providers configured for the organization, with name, short name, whether each is active and its settings. Read-only.',
		idempotent: true,
	},
	props: {
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order. Defaults to name.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Name', value: 'name' },
					{ label: 'Name (descending)', value: '-name' },
					{ label: 'Short name', value: 'short_name' },
					{ label: 'Active', value: 'active' },
					{ label: 'Created (oldest first)', value: 'created_at' },
					{ label: 'Created (newest first)', value: '-created_at' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listAuthenticationProviders({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { sort: p.sort } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
