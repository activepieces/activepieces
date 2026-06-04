import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const addCommentAction = createAction({
	auth: confluenceAuth,
	name: 'add-comment',
	displayName: 'Add Comment to Page',
	description: 'Adds a footer comment to a page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		body: Property.LongText({
			displayName: 'Comment',
			description: 'Comment body in storage (XHTML) format. Plain text works too.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, body } = context.propsValue;

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.POST,
			version: 'v2',
			resourceUri: '/footer-comments',
			body: {
				pageId,
				body: {
					representation: 'storage',
					value: body,
				},
			},
		});
	},
});
