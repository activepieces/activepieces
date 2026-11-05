import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendFaxAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_fax',
	displayName: 'Send Fax',
	description: 'Sends a fax from a PDF or stored media.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a fax of a PDF (public URL or stored media name) from a Telnyx number. Connection ID must be a fax application id from List Fax Applications. Sending is asynchronous: check progress with Get Fax. Not idempotent: every call sends a new fax.',
		idempotent: false,
	},
	props: {
		connectionId: Property.ShortText({
			displayName: 'Fax Application ID',
			description:
				'ID of the fax application to send through. Use List Fax Applications to find it.',
			required: true,
		}),
		to: Property.ShortText({
			displayName: 'To',
			description: 'Destination fax number in E.164 format, or a SIP URI.',
			required: true,
		}),
		from: Property.ShortText({
			displayName: 'From',
			description: 'Sending Telnyx number in E.164 format.',
			required: true,
		}),
		mediaUrl: Property.ShortText({
			displayName: 'Media URL',
			description: 'Public URL of the PDF to fax. Set this or Media Name.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of stored media to fax (from Upload Media). Set this or Media URL.',
			required: false,
		}),
		fromDisplayName: Property.ShortText({
			displayName: 'From Display Name',
			description: 'Text shown as the sender name on the fax header.',
			required: false,
		}),
		quality: Property.StaticDropdown({
			displayName: 'Quality',
			description: 'Fax resolution. Defaults to high.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
					{ label: 'Very High', value: 'very_high' },
					{ label: 'Ultra Light', value: 'ultra_light' },
					{ label: 'Ultra Dark', value: 'ultra_dark' },
				],
			},
		}),
		t38Enabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'T.38',
			description: 'Whether to use T.38 for the transmission. Defaults to Yes.',
		}),
		monochrome: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Monochrome',
			description: 'Whether to send in black and white.',
		}),
		storeMedia: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Store Media',
			description: 'Whether Telnyx keeps a copy of the fax document.',
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'URL that receives fax status webhooks.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendFax({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					connection_id: p.connectionId,
					to: p.to,
					from: p.from,
					media_url: p.mediaUrl,
					media_name: p.mediaName,
					from_display_name: p.fromDisplayName,
					quality: p.quality,
					t38_enabled: p.t38Enabled,
					monochrome: p.monochrome,
					store_media: p.storeMedia,
					webhook_url: p.webhookUrl,
					client_state: p.clientState,
				},
			}),
		});
	},
});
