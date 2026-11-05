import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSipReferCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_sip_refer_call',
	displayName: 'SIP Refer Call',
	description: 'Sends a SIP REFER to move a call to another SIP address.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a SIP REFER so the far end moves the call to another SIP URI (blind transfer on SIP connections). Only works when the other side supports REFER.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		sipAddress: Property.ShortText({
			displayName: 'SIP Address',
			description: 'Destination SIP URI, e.g. "sip:alice@example.com".',
			required: true,
		}),
		sipAuthUsername: Property.ShortText({
			displayName: 'SIP Auth Username',
			description: 'Optional username if the destination asks for authentication.',
			required: false,
		}),
		sipAuthPassword: Property.ShortText({
			displayName: 'SIP Auth Password',
			description: 'Optional password for SIP authentication.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'refer',
			body: telnyxUtils.compact({
				values: {
					sip_address: p.sipAddress,
					sip_auth_username: p.sipAuthUsername,
					sip_auth_password: p.sipAuthPassword,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
