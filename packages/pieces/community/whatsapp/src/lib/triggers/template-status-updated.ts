import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { whatsappWebhook } from '../common/webhook';
import { templateStatusUpdatedOutputSchema } from '../output-schemas';

export const templateStatusUpdated = createTrigger({
	auth: whatsappAuth,
	name: 'template_status_updated',
	outputSchema: templateStatusUpdatedOutputSchema,
	classification: 'READ',
	displayName: 'Template Status Updated',
	description: 'Fires when Meta approves, rejects, pauses or otherwise changes a message template.',
	aiMetadata: {
		description:
			'Fires once per status change on a WhatsApp message template: APPROVED, REJECTED, PAUSED, DISABLED, PENDING and related events. The payload names the template, its language, the new event and, for rejections, the reason and Meta\'s recommendation. Subscribe your app to the message_template_status_update webhook field for this to fire.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: whatsappWebhook.setupInstructions,
		verify_token: whatsappWebhook.verifyToken,
	},
	sampleData: {
		waba_id: '102290129340398',
		event: 'APPROVED',
		message_template_id: '959304846505478',
		message_template_name: 'hello_world',
		message_template_language: 'en_US',
		reason: null,
		disable_date: null,
		other_info_title: null,
		other_info_description: null,
		rejection_reason: null,
		rejection_recommendation: null,
	},
	handshakeConfiguration: whatsappWebhook.handshakeConfiguration,
	async onHandshake(context) {
		return whatsappWebhook.handleHandshake({
			queryParams: context.payload.queryParams,
			expectedToken: context.propsValue.verify_token,
		});
	},
	async onEnable() {
		return;
	},
	async onDisable() {
		return;
	},
	async run(context) {
		if (!whatsappWebhook.isSignedByMeta({ appSecret: context.auth.props.app_secret, headers: context.payload.headers, rawBody: context.payload.rawBody })) {
			return [];
		}
		return whatsappWebhook
			.extractChanges({ body: context.payload.body, field: 'message_template_status_update' })
			.map((value) => ({
				waba_id: value.waba_id,
				event: value.event ?? null,
				message_template_id: value.message_template_id != null ? String(value.message_template_id) : null,
				message_template_name: value.message_template_name ?? null,
				message_template_language: value.message_template_language ?? null,
				reason: value.reason ?? null,
				disable_date: value.disable_info?.disable_date ?? null,
				other_info_title: value.other_info?.title ?? null,
				other_info_description: value.other_info?.description ?? null,
				rejection_reason: value.rejection_info?.reason ?? null,
				rejection_recommendation: value.rejection_info?.recommendation ?? null,
			}));
	},
});
