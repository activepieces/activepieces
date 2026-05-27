import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioApiCall, verifyWebhookSignature } from '../common/client';
import { attioAuth } from '../auth';
import { objectAttributeDropdown, objectTypeIdDropdown } from '../common/props';
import { ObjectWebhookPayload, WebhookResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'updated-record-trigger';

export const recordUpdatedTrigger = createTrigger({
	name: 'record_updated',
	displayName: 'Record Updated',
	description:
		'Triggers when an existing record is updated (people, companies, deals, etc.).',
	auth: attioAuth,
	props: {
		objectTypeId: objectTypeIdDropdown({
			displayName: 'Object',
			required: true,
		}),
		filter_attribute: objectAttributeDropdown({
			displayName: 'Filter Field',
			description: 'Only trigger when this field is involved in the update.',
			required: false,
		}),
		filter_value: Property.ShortText({
			displayName: 'Filter Value',
			description:
				'Only trigger when the selected field equals this value (case-insensitive). Leave empty to trigger on any update to that field.',
			required: false,
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {},
	async onEnable(context) {
		const response = await attioApiCall<{ data: WebhookResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/webhooks',
			body: {
				data: {
					target_url: context.webhookUrl,
					subscriptions: [
						{
							event_type: 'record.updated',
							filter: {
								$and: [
									{
										field: 'id.object_id',
										operator: 'equals',
										value: context.propsValue.objectTypeId,
									},
								],
							},
						},
					],
				},
			},
		});

		await context.store.put<{ webhookId: string; WebhookSecret: string }>(TRIGGER_KEY, {
			webhookId: response.data.id.webhook_id,
			WebhookSecret: response.data.secret,
		});
	},
	async onDisable(context) {
		const webhookData = await context.store.get<{ webhookId: string; WebhookSecret: string }>(
			TRIGGER_KEY,
		);
		if (!isNil(webhookData) && webhookData.webhookId) {
			await attioApiCall({
				accessToken: context.auth.secret_text,
				method: HttpMethod.DELETE,
				resourceUri: `/webhooks/${webhookData.webhookId}`,
			});
		}
	},
	async test(context) {
		const { filter_attribute, filter_value } = context.propsValue;
		const fetchLimit = filter_attribute ? 20 : 5;

		const response = await attioApiCall<{ data: Array<Record<string, unknown>> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/objects/${context.propsValue.objectTypeId}/records/query`,
			body: { limit: fetchLimit, offset: 0 },
		});

		const filtered = response.data.filter((record) =>
			recordMatchesFilter(record, filter_attribute, filter_value),
		);

		return filtered.slice(0, 5);
	},
	async run(context) {
		const triggerData = await context.store.get<{ webhookId: string; WebhookSecret: string }>(
			TRIGGER_KEY,
		);

		const webhookSecret = triggerData?.WebhookSecret;
		const webhookSignatureHeader = context.payload.headers['attio-signature'];
		const rawBody = context.payload.rawBody;

		if (!verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)) {
			return [];
		}

		const payload = context.payload.body as ObjectWebhookPayload;
		const event = payload.events?.[0];

		if (!event) return [];

		const recordId = event.id.record_id;

		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${context.propsValue.objectTypeId}/records/${recordId}`,
		});

		const record = response.data;
		const { filter_attribute, filter_value } = context.propsValue;

		if (!recordMatchesFilter(record, filter_attribute, filter_value)) {
			return [];
		}

		return [record];
	},
});

function recordMatchesFilter(
	record: Record<string, unknown>,
	filterAttribute: string | undefined,
	filterValue: string | undefined,
): boolean {
	if (!filterAttribute) return true;

	const values = record['values'];
	const attrValues: Array<Record<string, unknown>> =
		values !== null && typeof values === 'object' && !Array.isArray(values)
			? ((values as Record<string, unknown>)[filterAttribute] as Array<Record<string, unknown>> ?? [])
			: [];

	if (filterValue) {
		return attrValues.some((v) => {
			const current = extractAttributeDisplayValue(v);
			return current !== null && current.toLowerCase() === filterValue.toLowerCase();
		});
	}

	return attrValues.length > 0;
}

function extractAttributeDisplayValue(valueObj: Record<string, unknown>): string | null {
	if (isNil(valueObj)) return null;
	// active_until being non-null means the value is no longer active
	if (!isNil(valueObj['active_until'])) return null;

	const status = valueObj['status'];
	const option = valueObj['option'];

	return (
		(typeof valueObj['full_name'] === 'string' ? valueObj['full_name'] : null) ??
		(typeof valueObj['email_address'] === 'string' ? valueObj['email_address'] : null) ??
		(typeof valueObj['domain'] === 'string' ? valueObj['domain'] : null) ??
		(typeof valueObj['phone_number'] === 'string' ? valueObj['phone_number'] : null) ??
		(status !== null && typeof status === 'object'
			? ((status as Record<string, unknown>)['title'] as string | undefined) ?? null
			: null) ??
		(option !== null && typeof option === 'object'
			? ((option as Record<string, unknown>)['title'] as string | undefined) ?? null
			: null) ??
		(valueObj['value'] !== undefined ? String(valueObj['value']) : null)
	);
}
