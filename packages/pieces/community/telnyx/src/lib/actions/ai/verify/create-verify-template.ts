import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCreateVerifyTemplateAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_verify_template',
	displayName: 'Create Verify Template',
	description: 'Creates a message template for verification codes.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Verify message template and returns its id. Templates cannot be deleted through the API, so check List Verify Templates for an existing one first. Not idempotent: every call creates a new template.',
		idempotent: false,
	},
	props: {
		text: Property.LongText({
			displayName: 'Text',
			description:
				'Template text. Must contain the {{code}} placeholder, e.g. "Your {{app_name}} code is {{code}}".',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.createVerifyTemplate({
			auth: context.auth,
			text: context.propsValue.text,
		});
	},
});
