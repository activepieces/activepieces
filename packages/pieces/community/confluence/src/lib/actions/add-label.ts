import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const addLabelAction = createAction({
	auth: confluenceAuth,
	name: 'add-label',
	displayName: 'Add Label to Page',
	description: 'Adds one or more labels to a page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		labels: Property.Array({
			displayName: 'Labels',
			description: 'Label names to add (one per row).',
			required: true,
		}),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			required: true,
			defaultValue: 'global',
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'My (personal)', value: 'my' },
					{ label: 'Team', value: 'team' },
				],
			},
		}),
	},
	async run(context) {
		const { pageId, labels, prefix } = context.propsValue;
		const labelList = (labels as string[]).map((name) => ({ prefix, name }));

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.POST,
			version: 'v1',
			resourceUri: `/content/${pageId}/label`,
			body: labelList,
		});
	},
});
