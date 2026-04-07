import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const updateMonitor = createAction({
	auth: pubrioAuth,
	name: 'update_monitor',
	displayName: 'Update Monitor',
	description: 'Update an existing signal monitor',
	props: {
		monitor_id: Property.ShortText({ displayName: 'Monitor ID', required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		detection_mode: Property.StaticDropdown({
			displayName: 'Detection Mode',
			required: false,
			options: {
				options: [
					{ label: 'New', value: 'new' },
					{ label: 'New and Updated', value: 'new_and_updated' },
				],
			},
		}),
		signal_types: Property.StaticMultiSelectDropdown({
			displayName: 'Signal Types',
			required: false,
			options: {
				options: [
					{ label: 'Jobs', value: 'jobs' },
					{ label: 'News', value: 'news' },
					{ label: 'Advertisements', value: 'advertisements' },
				],
			},
		}),
		destination_type: Property.StaticDropdown({
			displayName: 'Destination Type',
			required: false,
			options: {
				options: [
					{ label: 'Webhook', value: 'webhook' },
					{ label: 'Email', value: 'email' },
					{ label: 'Outreach Sequence', value: 'outreach_sequence' },
				],
			},
		}),
		webhook_url: Property.ShortText({ displayName: 'Webhook URL', required: false }),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		sequence_identifier: Property.ShortText({ displayName: 'Sequence Identifier', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		frequency_minute: Property.Number({ displayName: 'Frequency (minutes)', required: false }),
		max_daily_trigger: Property.Number({ displayName: 'Max Daily Triggers', required: false }),
		max_records_per_trigger: Property.Number({ displayName: 'Max Records Per Trigger', required: false }),
		companies: Property.ShortText({ displayName: 'Companies', description: 'Comma-separated company names', required: false }),
		domains: Property.ShortText({ displayName: 'Domains', description: 'Comma-separated domains', required: false }),
		linkedin_urls: Property.ShortText({ displayName: 'LinkedIn URLs', description: 'Comma-separated LinkedIn URLs', required: false }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			monitor_id: context.propsValue.monitor_id,
		};
		if (context.propsValue.name) body.name = context.propsValue.name;
		if (context.propsValue.detection_mode) body.detection_mode = context.propsValue.detection_mode;
		if (context.propsValue.signal_types && context.propsValue.signal_types.length > 0) body.signal_types = context.propsValue.signal_types;
		if (context.propsValue.destination_type) body.destination_type = context.propsValue.destination_type;
		if (context.propsValue.webhook_url) body.webhook_url = context.propsValue.webhook_url;
		if (context.propsValue.email) body.email = context.propsValue.email;
		if (context.propsValue.sequence_identifier) body.sequence_identifier = context.propsValue.sequence_identifier;
		if (context.propsValue.description) body.description = context.propsValue.description;
		if (context.propsValue.frequency_minute != null) body.frequency_minute = context.propsValue.frequency_minute;
		if (context.propsValue.max_daily_trigger != null) body.max_daily_trigger = context.propsValue.max_daily_trigger;
		if (context.propsValue.max_records_per_trigger != null) body.max_records_per_trigger = context.propsValue.max_records_per_trigger;
		if (context.propsValue.companies) body.companies = splitComma(context.propsValue.companies);
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		if (context.propsValue.linkedin_urls) body.linkedin_urls = splitComma(context.propsValue.linkedin_urls);
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/update', body);
	},
});
