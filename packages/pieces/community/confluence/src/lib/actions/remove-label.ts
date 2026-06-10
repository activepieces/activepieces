import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const removeLabelAction = createAction({
	auth: confluenceAuth,
	name: 'remove-label',
	displayName: 'Remove Label from Page',
	description: 'Removes a label from a page.',
	audience: 'both',
	aiMetadata: { description: 'Removes a single label, by name, from a Confluence page. Use to untag a page. Requires the page ID and the label name. Effectively idempotent — re-running after the label is gone leaves the page\'s label set unchanged.', idempotent: true },
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		label: Property.ShortText({
			displayName: 'Label',
			description: 'Label name to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, label } = context.propsValue;

		await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.DELETE,
			version: 'v1',
			resourceUri: `/content/${pageId}/label`,
			query: { name: label },
		});

		return { success: true, pageId, label };
	},
});
