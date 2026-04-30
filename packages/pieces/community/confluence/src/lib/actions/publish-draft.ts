import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';

type DraftPage = {
	id: string;
	status: string;
	title: string;
	version: { number: number };
	body?: { storage?: { value: string; representation: string } };
};

export const publishDraftAction = createAction({
	auth: confluenceAuth,
	name: 'publish-draft',
	displayName: 'Publish Draft',
	description: 'Publishes a draft page (changes status from draft to current).',
	props: {
		pageId: Property.ShortText({
			displayName: 'Draft Page ID',
			description: 'ID of the draft page to publish.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId } = context.propsValue;

		const draft = await confluenceApiCall<DraftPage>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			query: { 'body-format': 'storage', 'get-draft': 'true' },
		});

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.PUT,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			body: {
				id: pageId,
				status: 'current',
				title: draft.title,
				body: {
					representation: draft.body?.storage?.representation ?? 'storage',
					value: draft.body?.storage?.value ?? '',
				},
				version: { number: 1 },
			},
		});
	},
});
