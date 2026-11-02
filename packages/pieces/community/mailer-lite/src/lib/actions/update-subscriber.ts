import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { updateSubscriberOutputSchema } from '../output-schemas';

function formatDate(value: string | undefined): string | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		throw new Error(`Invalid date: ${value}`);
	}
	return parsed.format('YYYY-MM-DD HH:mm:ss');
}

export const updateSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'update_subscriber',
	classification: 'WRITE',
	displayName: 'Update Subscriber',
	description: 'Update fields or status of an existing subscriber.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Update an existing MailerLite subscriber by ID, sending only the values you supply: custom or default field values (fields object keyed by field key from list_fields), status, dates and IPs. Group membership is never changed here; use add_subscriber_to_group or remove_subscriber_from_group. The API cannot reactivate unsubscribed, bounced or junk subscribers. Get the ID from find_subscriber. At least one value is required. Idempotent.',
		idempotent: true,
	},
	outputSchema: updateSubscriberOutputSchema,
	props: {
		subscriber_id: Property.ShortText({
			displayName: 'Subscriber ID',
			description: 'The subscriber ID, from find_subscriber or list_subscribers.',
			required: true,
		}),
		fields: Property.Object({
			displayName: 'Fields',
			description: 'Field values to set, keyed by field key (e.g. name, last_name, or a custom field key from list_fields). Fields not listed are left alone.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'New subscriber status. Unsubscribed, bounced and junk subscribers cannot be reactivated through the API.',
			required: false,
			options: {
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Unconfirmed', value: 'unconfirmed' },
					{ label: 'Bounced', value: 'bounced' },
					{ label: 'Junk', value: 'junk' },
				],
			},
		}),
		subscribed_at: Property.DateTime({
			displayName: 'Subscribed At',
			description: 'When the subscriber subscribed.',
			required: false,
		}),
		opted_in_at: Property.DateTime({
			displayName: 'Opted In At',
			description: 'When the subscriber confirmed the opt-in.',
			required: false,
		}),
		unsubscribed_at: Property.DateTime({
			displayName: 'Unsubscribed At',
			description: 'When the subscriber unsubscribed.',
			required: false,
		}),
		ip_address: Property.ShortText({
			displayName: 'IP Address',
			description: 'The IP address the subscriber signed up from.',
			required: false,
		}),
		optin_ip: Property.ShortText({
			displayName: 'Opt-in IP',
			description: 'The IP address the subscriber confirmed the opt-in from.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' });
		const { fields, status, ip_address, optin_ip } = context.propsValue;
		const candidate: Record<string, unknown> = {
			fields: fields && Object.keys(fields).length > 0 ? fields : undefined,
			status: status || undefined,
			subscribed_at: formatDate(context.propsValue.subscribed_at),
			opted_in_at: formatDate(context.propsValue.opted_in_at),
			unsubscribed_at: formatDate(context.propsValue.unsubscribed_at),
			ip_address: ip_address || undefined,
			optin_ip: optin_ip || undefined,
		};
		const body = Object.fromEntries(Object.entries(candidate).filter(([, value]) => value !== undefined));
		if (Object.keys(body).length === 0) {
			throw new Error('Provide at least one value to update.');
		}
		const response = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/subscribers/${id}`,
			resource: `subscriber ${id}`,
			body,
		});
		return mailerLiteApi.unwrapData(response);
	},
});
