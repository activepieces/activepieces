import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const listAttachmentsAction = createAction({
	auth: confluenceAuth,
	name: 'list-attachments',
	displayName: 'List Attachments',
	description: 'Lists all attachments on a page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
	},
	async run(context) {
		const { pageId } = context.propsValue;

		const response = await confluenceApiCall<PaginatedResponse<unknown>>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${pageId}/attachments`,
			query: { limit: '100' },
		});

		return { results: response.results ?? [] };
	},
});
