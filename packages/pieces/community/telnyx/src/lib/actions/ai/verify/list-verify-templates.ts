import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxListVerifyTemplatesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_verify_templates',
	displayName: 'List Verify Templates',
	description: 'Lists the message templates for verification codes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Verify message template (id and text). Pass a template id as messaging_template_id inside the SMS Settings of Create Verify Profile or Update Verify Profile.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const templates = await telnyxApi.listVerifyTemplates({ auth: context.auth });
		return { templates, count: templates.length };
	},
});
