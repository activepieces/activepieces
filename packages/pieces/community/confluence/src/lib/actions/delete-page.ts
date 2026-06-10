import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const deletePageAction = createAction({
	auth: confluenceAuth,
	name: 'delete-page',
	displayName: 'Delete Page',
	description: 'Trashes or permanently deletes a page.',
	audience: 'both',
	aiMetadata: { description: 'Deletes a Confluence page by ID; by default it is moved to the trash, or when "purge permanently" is enabled it is removed from the trash for good. Use to remove a page. Not idempotent in practice: it mutates page state and re-running after deletion errors rather than returning the same result, and a purge is irreversible.', idempotent: false },
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		purge: Property.Checkbox({
			displayName: 'Purge Permanently',
			description:
				'If enabled, the page is removed from the trash permanently. Otherwise it is moved to trash.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { pageId, purge } = context.propsValue;

		await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.DELETE,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			query: purge ? { purge: 'true' } : undefined,
		});

		return { success: true, pageId };
	},
});
