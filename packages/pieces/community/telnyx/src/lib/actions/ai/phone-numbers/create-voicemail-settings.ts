import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateVoicemailSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_voicemail_settings',
	displayName: 'Create Voicemail Settings',
	description: 'Sets up voicemail on a phone number.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets up voicemail on a phone number that has none yet. To change existing voicemail settings use Update Voicemail Settings.',
		idempotent: false,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
		enabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Enabled',
			description: 'Whether voicemail is enabled.',
		}),
		pin: Property.ShortText({
			displayName: 'PIN',
			description: 'Numeric PIN to access the voicemail box, 4 to 8 digits.',
			required: false,
		}),
		greeting: Property.Json({
			displayName: 'Greeting',
			description:
				'Optional JSON object, e.g. {"type":"default"} or {"type":"text","text":"Please leave a message."}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createVoicemailSettings({
			auth: context.auth,
			phoneNumberId: p.phoneNumberId,
			body: telnyxUtils.compact({
				values: { enabled: p.enabled, pin: p.pin, greeting: p.greeting },
			}),
		});
	},
});
