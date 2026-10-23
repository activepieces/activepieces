import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxUpdateVerifyTemplateAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_verify_template',
	displayName: 'Update Verify Template',
	description: 'Changes the text of a verification message template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the text of a Verify message template. Use List Verify Templates to find the id.',
		idempotent: true,
	},
	props: {
		templateId: Property.ShortText({
			displayName: 'Template ID',
			description: 'Template UUID. Use List Verify Templates to find it.',
			required: true,
		}),
		text: Property.LongText({
			displayName: 'Text',
			description:
				'Template text. Must contain the {{code}} placeholder, e.g. "Your {{app_name}} code is {{code}}".',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateVerifyTemplate({
			auth: context.auth,
			templateId: p.templateId,
			text: p.text,
		});
	},
});
