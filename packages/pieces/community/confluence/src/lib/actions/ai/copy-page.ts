import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCopyPageOutputSchema } from '../../output-schemas';

export const copyPageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_copy_page',
	outputSchema: confluenceCopyPageOutputSchema,
	displayName: 'Copy Page',
	description: 'Copies a page to a space, under a parent page, or over an existing page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Copies a single Confluence page (not its children) to the root of a space (by space key), under a parent page, or over an existing page (replacing its content). Optionally copies attachments, labels, permissions and properties. Not idempotent: each call creates another copy.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		destinationType: Property.StaticDropdown({
			displayName: 'Destination Type',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Under a parent page', value: 'parent_page' },
					{ label: 'Root of a space', value: 'space' },
					{ label: 'Replace an existing page', value: 'existing_page' },
				],
			},
		}),
		destinationValue: Property.ShortText({
			displayName: 'Destination',
			description:
				'Parent or existing page ID for page destinations; space key (e.g. "DOCS") for a space.',
			required: true,
		}),
		pageTitle: Property.ShortText({
			displayName: 'New Title',
			description:
				'Title of the copy. Needed when copying into the same space, where titles must be unique.',
			required: false,
		}),
		copyAttachments: Property.Checkbox({ displayName: 'Copy Attachments', required: false }),
		copyLabels: Property.Checkbox({ displayName: 'Copy Labels', required: false }),
		copyPermissions: Property.Checkbox({ displayName: 'Copy Permissions', required: false }),
		copyProperties: Property.Checkbox({ displayName: 'Copy Properties', required: false }),
	},
	async run(context) {
		const {
			pageId,
			destinationType,
			destinationValue,
			pageTitle,
			copyAttachments,
			copyLabels,
			copyPermissions,
			copyProperties,
		} = context.propsValue;
		return await confluenceApi.copyPage({
			auth: context.auth,
			pageId,
			destination: { type: destinationType, value: destinationValue },
			pageTitle,
			copyAttachments,
			copyLabels,
			copyPermissions,
			copyProperties,
		});
	},
});
