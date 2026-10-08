import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';

export const renderMultiPagePdfAction = createAction({
	auth: robollyAuth,
	name: 'robolly_render_multi_page_pdf',
	displayName: 'Render Multi-Page PDF',
	description: 'Renders a multi-page PDF set up on the Multi PDF page of the Robolly dashboard.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Renders a multi-page PDF from a Multi PDF set up in the Robolly dashboard. The Multi PDF ID and each page's template ID only appear in the render link the dashboard generates, so the user must supply them. Each call uses render credits.",
		idempotent: false,
	},
	props: {
		multipdfId: Property.ShortText({
			displayName: 'Multi PDF ID',
			description:
				'The 24-character Multi PDF ID: the multipdfId value in the render link from Dashboard → Multi PDF.',
			required: true,
		}),
		pages: Property.Array({
			displayName: 'Pages',
			description:
				'One object per page, in order: {"id": "<page template ID from the t[n][id] value in the render link>", "<element>": "<value>", …}.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const pages = propsValue.pages;
		if (
			!pages.every(
				(page): page is Record<string, unknown> =>
					typeof page === 'object' && page !== null && !Array.isArray(page),
			)
		) {
			throw new Error('Each item in "Pages" must be an object of element values.');
		}
		return await robollyApi.renderMultiPagePdf({ auth, multipdfId: propsValue.multipdfId, pages });
	},
});
