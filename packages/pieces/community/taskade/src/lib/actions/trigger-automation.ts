import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeApi } from '../common/client';
import { taskadeOutputSchemas } from '../output-schemas';

export const triggerAutomationAction = createAction({
	auth: taskadeAuth,
	name: 'trigger_automation',
	displayName: 'Trigger Taskade Automation',
	description: 'Starts a Taskade automation that begins with a Webhook trigger, sending a JSON payload.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Starts a Taskade automation whose trigger is a Webhook, by POSTing a JSON object to the automation\'s https://www.taskade.com/webhooks/... URL; the payload fields become automation variables. Use when the user gives that URL. Not idempotent: each call runs the automation again.',
		idempotent: false,
	},
	props: {
		webhookUrl: Property.ShortText({
			displayName: 'Automation Webhook URL',
			description: 'In the Taskade automation, add a Webhook trigger and copy its URL (https://www.taskade.com/webhooks/...).',
			required: true,
		}),
		payload: Property.Json({
			displayName: 'Payload',
			description: 'JSON object to send. Each field becomes a variable in the automation.',
			required: false,
			defaultValue: {},
		}),
		bearerToken: Property.ShortText({
			displayName: 'Webhook Bearer Token',
			description: 'Only if the webhook trigger has Bearer Token authentication turned on. This is the webhook\'s own secret, not your personal access token.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['triggerAutomation'],
	async run(context) {
		const url = parseAutomationUrl(context.propsValue.webhookUrl);
		const payload = parsePayload(context.propsValue.payload);
		const bearer = (context.propsValue.bearerToken ?? '').trim();
		try {
			const response = await httpClient.sendRequest({
				method: HttpMethod.POST,
				url,
				headers: {
					'Content-Type': 'application/json',
					...(bearer.length > 0 ? { Authorization: `Bearer ${bearer}` } : {}),
				},
				body: payload,
				timeout: 30_000,
				followRedirects: false,
			});
			if (response.status >= 300) {
				throw new Error(`Taskade automation webhook answered with HTTP ${response.status} (redirects are not followed). Check the webhook URL.`);
			}
			return { status: response.status, ok: true };
		} catch (error) {
			const status = taskadeApi.statusOf(error);
			if (status === undefined) {
				throw error;
			}
			if (status === 401 || status === 403) {
				throw new Error(`Taskade rejected the call (HTTP ${status}). The webhook needs a valid Webhook Bearer Token.`);
			}
			if (status === 404 || status === 410) {
				throw new Error(`Taskade does not know this webhook URL (HTTP ${status}). The automation or its trigger may have been deleted; copy the current URL.`);
			}
			if (status === 402) {
				throw new Error('Taskade webhook automations need a Pro plan or above (HTTP 402).');
			}
			throw new Error(`Taskade automation webhook failed with HTTP ${status}.`);
		}
	},
});

function parseAutomationUrl(value: unknown): string {
	const text = taskadeApi.requireText({ value, label: 'Automation Webhook URL' });
	const url = taskadeApi.safeUrl(text);
	if (
		!url ||
		url.protocol !== 'https:' ||
		url.username !== '' ||
		url.password !== '' ||
		url.port !== '' ||
		!ALLOWED_HOSTS.includes(url.hostname.toLowerCase()) ||
		!url.pathname.startsWith('/webhooks/') ||
		url.pathname.split('/').some((part) => part === '..' || part === '.')
	) {
		throw new Error('Automation Webhook URL must be a Taskade webhook URL starting with https://www.taskade.com/webhooks/.');
	}
	return url.toString();
}

function parsePayload(value: unknown): Record<string, unknown> {
	if (value === undefined || value === null || value === '') {
		return {};
	}
	const parsed: unknown = typeof value === 'string' ? safeJson(value) : value;
	if (!taskadeApi.isRecord(parsed)) {
		throw new Error('Payload must be a JSON object, for example {"customer": "Jane"}.');
	}
	return parsed;
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error('Payload must be valid JSON.');
	}
}

const ALLOWED_HOSTS = ['www.taskade.com', 'taskade.com'];
