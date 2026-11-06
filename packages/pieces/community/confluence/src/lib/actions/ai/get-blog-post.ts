import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetBlogPostOutputSchema } from '../../output-schemas';

export const getBlogPostAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_blog_post',
	outputSchema: confluenceGetBlogPostOutputSchema,
	displayName: 'Get Blog Post',
	description: 'Gets a blog post by ID, with its body.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence blog post by its numeric ID, including the body in the chosen format and optionally its labels, properties and versions.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
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
			description: 'Return the unpublished draft instead of the published version.',
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
			blogPostId,
			bodyFormat,
			getDraft,
			version,
			includeLabels,
			includeProperties,
			includeVersions,
		} = context.propsValue;
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
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
