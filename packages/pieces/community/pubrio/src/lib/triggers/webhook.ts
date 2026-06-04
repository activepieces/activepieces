import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pubrioAuth } from '../../index';

export const pubrioWebhookTrigger = createTrigger({
	auth: pubrioAuth,
	name: 'pubrio_monitor_event',
	displayName: 'Monitor Event (Webhook)',
	description:
		'Triggers once per signal (signal_first mode) or once per company (company_first mode) when a Pubrio monitor fires. Copy the webhook URL into your Pubrio monitor destination configuration.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable() {},
	async onDisable() {},
	async run(context) {
		const body = context.payload.body as Record<string, unknown>;
		if (!body) return [];

		const monitor = body['monitor'] as Record<string, unknown> | undefined;
		const triggeredAt = body['triggered_at'];
		const detectionMode = monitor?.['detection_mode'];

		const base = { monitor, triggered_at: triggeredAt };

		if (detectionMode === 'signal_first') {
			const signals = body['signals'];
			if (Array.isArray(signals) && signals.length > 0) {
				return signals.map((signal: unknown) => ({ ...(signal as object), ...base }));
			}
		}

		if (detectionMode === 'company_first') {
			const companies = body['companies'];
			if (Array.isArray(companies) && companies.length > 0) {
				return companies.map((company: unknown) => ({ ...(company as object), ...base }));
			}
		}

		return [body];
	},
	sampleData: {
		signal_type: 'jobs',
		signal: {
			signal_type: 'jobs',
			job_search_id: 'job-search-001',
			companies: [
				{
					domain_search_id: 'domain-search-001',
					company_name: 'Acme Corp',
					domain: 'acme.com',
				},
			],
		},
		companies: [
			{
				domain_search_id: 'domain-search-001',
				company_name: 'Acme Corp',
				domain: 'acme.com',
				logo_url: 'https://logo.clearbit.com/acme.com',
				country_code: 'US',
				company_size: 5000,
				industry: 'Software',
				estimated_revenue: 50000000,
				founded_year: 2015,
				linkedin_url: 'https://linkedin.com/company/acme-corp',
				people: [
					{
						people_search_id: 'person-001',
						name: 'Jane Smith',
						title: 'VP of Engineering',
						linkedin_url: 'https://linkedin.com/in/janesmith',
						email: 'j.smith@acme.com',
						phone: '+14155551234',
					},
				],
				emails: ['info@acme.com'],
				phones: ['+14155550000'],
			},
		],
		monitor: {
			monitor_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			name: 'My Signal Monitor',
			detection_mode: 'signal_first',
			signal_types: ['jobs', 'news'],
			is_company_enrichment: true,
			is_people_enrichment: true,
		},
		triggered_at: '2026-04-05T20:29:43.832Z',
	},
});
