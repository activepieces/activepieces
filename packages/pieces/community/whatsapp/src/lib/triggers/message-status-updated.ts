import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { phoneNumberDropdown } from '../common/utils';
import { whatsappWebhook } from '../common/webhook';
import { inputUtils } from '../common/inputs';
import { messageStatusUpdatedOutputSchema } from '../output-schemas';

export const messageStatusUpdated = createTrigger({
	auth: whatsappAuth,
	name: 'message_status_updated',
	outputSchema: messageStatusUpdatedOutputSchema,
	classification: 'READ',
	displayName: 'Message Status Updated',
	description: 'Fires when a message you sent is delivered, read, or fails.',
	aiMetadata: {
		description:
			'Fires once per delivery-state change of a message the business sent: sent, delivered, read or failed. The payload has the message id to match against your send step, the new status, conversation and pricing details, and the error code and message when delivery failed. Filter by status to react only to failures or read receipts.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: whatsappWebhook.setupInstructions,
		verify_token: whatsappWebhook.verifyToken,
		phone_number_id: phoneNumberDropdown({ required: false }),
		status: Property.StaticMultiSelectDropdown({
			displayName: 'Statuses',
			description: 'Only fire for these statuses. Leave empty for all.',
			required: false,
			options: {
				options: [
					{ label: 'Sent', value: 'sent' },
					{ label: 'Delivered', value: 'delivered' },
					{ label: 'Read', value: 'read' },
					{ label: 'Failed', value: 'failed' },
				],
			},
		}),
	},
	sampleData: {
		message_id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAERgSRTAwNUQyMjA1MTA2QUIxODREAA==',
		status: 'delivered',
		recipient_id: '962782550213',
		timestamp: '1789520050',
		updated_at: '2026-09-16T00:54:10.000Z',
		phone_number_id: '1285944454608901',
		display_phone_number: '15551394669',
		conversation_id: 'a8b1c2d3e4f5061728394a5b6c7d8e9f',
		conversation_origin: 'utility',
		conversation_expires_at: '2026-09-17T00:53:20.000Z',
		billable: true,
		pricing_model: 'CBP',
		pricing_category: 'utility',
		error_code: null,
		error_title: null,
		error_message: null,
		error_details: null,
		raw: {
			id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAERgSRTAwNUQyMjA1MTA2QUIxODREAA==',
			status: 'delivered',
			timestamp: '1789520050',
			recipient_id: '962782550213',
			conversation: { id: 'a8b1c2d3e4f5061728394a5b6c7d8e9f', origin: { type: 'utility' }, expiration_timestamp: '1789606400' },
			pricing: { billable: true, pricing_model: 'CBP', category: 'utility' },
		},
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
		const phoneNumberId = context.propsValue.phone_number_id;
		const wantedStatuses = inputUtils.asStrings(context.propsValue.status);
		return whatsappWebhook
			.extractChanges({ body: context.payload.body, field: 'messages' })
			.filter((value) => whatsappWebhook.matchesPhoneNumber({ value, phoneNumberId }))
			.flatMap((value) =>
				(value.statuses ?? [])
					.filter((status) => wantedStatuses.length === 0 || wantedStatuses.includes(status.status))
					.map((status) => whatsappWebhook.flattenStatus({ status, value })),
			);
	},
});
