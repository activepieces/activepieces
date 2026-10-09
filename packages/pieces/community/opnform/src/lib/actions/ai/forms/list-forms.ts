import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformListFormsOutputSchema } from '../../../output-schemas';

export const opnformListFormsAction = createAction({
	auth: opnformAuth,
	name: 'opnform_list_forms',
	outputSchema: opnformListFormsOutputSchema,
	displayName: 'List Forms',
	description: 'Lists one page of forms in a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of form summaries in a workspace: numeric id, slug, title, visibility, submission count and share URL. Fields are not included; use Get Form for them. Page through with Page and Per Page using the returned meta.',
		idempotent: true,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
		page: opnformAiProps.page({ required: false }),
		perPage: opnformAiProps.perPage({ required: false }),
	},
	async run(context) {
		const { workspaceId, page, perPage } = context.propsValue;
		return await opnformApi.listWorkspaceForms({ auth: context.auth, workspaceId, page, perPage });
	},
});
