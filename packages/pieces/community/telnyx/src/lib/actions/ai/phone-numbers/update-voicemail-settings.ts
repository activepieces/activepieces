import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateVoicemailSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_voicemail_settings',
	displayName: 'Update Voicemail Settings',
	description: 'Updates voicemail on a phone number, keeping every setting you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a phone number's voicemail: enable or disable it, change the PIN or the greeting. Only the fields you set are sent.",
		idempotent: true,
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
		return await telnyxApi.updateVoicemailSettings({
			auth: context.auth,
			phoneNumberId: p.phoneNumberId,
			body: telnyxUtils.compact({
				values: { enabled: p.enabled, pin: p.pin, greeting: p.greeting },
			}),
		});
	},
});
