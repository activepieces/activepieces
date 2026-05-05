import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const listCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'list-comments',
	displayName: 'List Comments',
	description: 'Lists footer and/or inline comments on a page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		commentType: Property.StaticDropdown({
			displayName: 'Comment Type',
			required: true,
			defaultValue: 'footer',
			options: {
				disabled: false,
				options: [
					{ label: 'Footer comments', value: 'footer' },
					{ label: 'Inline comments', value: 'inline' },
					{ label: 'Both', value: 'both' },
				],
			},
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			required: true,
			defaultValue: 'storage',
			options: {
				disabled: false,
				options: [
					{ label: 'Storage (XHTML)', value: 'storage' },
					{ label: 'View (HTML)', value: 'view' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
				],
			},
		}),
	},
	async run(context) {
		const { pageId, commentType, bodyFormat } = context.propsValue;

		const fetch = async (type: 'footer' | 'inline') => {
			const response = await confluenceApiCall<PaginatedResponse<unknown>>({
				domain: context.auth.props.confluenceDomain,
				username: context.auth.props.username,
				password: context.auth.props.password,
				method: HttpMethod.GET,
				version: 'v2',
				resourceUri: `/pages/${pageId}/${type}-comments`,
				query: {
					'body-format': bodyFormat,
					limit: '100',
				},
			});
			return response.results ?? [];
		};

		if (commentType === 'both') {
			const [footer, inline] = await Promise.all([fetch('footer'), fetch('inline')]);
			return { footer, inline };
		}

		return { results: await fetch(commentType as 'footer' | 'inline') };
	},
});
