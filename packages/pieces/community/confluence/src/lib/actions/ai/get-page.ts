import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetPageOutputSchema } from '../../output-schemas';

export const getPageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_page',
	outputSchema: confluenceGetPageOutputSchema,
	displayName: 'Get Page',
	description: 'Gets a page by ID, with its body.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence page by its numeric ID, including the body in the chosen format and optionally its labels, properties and versions. Use Get Page by URL when you only have a link, and List Page Descendants to read its sub-pages.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'Body representation to return. Defaults to storage (XHTML).',
			required: false,
			defaultValue: 'storage',
			options: {
				disabled: false,
				options: [
					{ label: 'Storage (XHTML)', value: 'storage' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
					{ label: 'View (rendered HTML)', value: 'view' },
					{ label: 'Export view', value: 'export_view' },
					{ label: 'Styled view', value: 'styled_view' },
				],
			},
		}),
		getDraft: Property.Checkbox({
			displayName: 'Get Draft',
			description: 'Return the unpublished draft of the page instead of the published version.',
			required: false,
		}),
		version: Property.Number({
			displayName: 'Version',
			description: 'Return this historical version number instead of the latest.',
			required: false,
		}),
		includeLabels: Property.Checkbox({ displayName: 'Include Labels', required: false }),
		includeProperties: Property.Checkbox({ displayName: 'Include Properties', required: false }),
		includeVersions: Property.Checkbox({ displayName: 'Include Versions', required: false }),
	},
	async run(context) {
		const {
			pageId,
			bodyFormat,
			getDraft,
			version,
			includeLabels,
			includeProperties,
			includeVersions,
		} = context.propsValue;
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			query: {
				'body-format': bodyFormat ?? 'storage',
				'get-draft': getDraft || undefined,
				version,
				'include-labels': includeLabels || undefined,
				'include-properties': includeProperties || undefined,
				'include-versions': includeVersions || undefined,
			},
		});
	},
});
