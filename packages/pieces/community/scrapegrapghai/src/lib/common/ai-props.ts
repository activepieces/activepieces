import { Property } from '@activepieces/pieces-framework';

function url<R extends boolean>({
	required,
	displayName = 'URL',
	description = 'Public page URL including the scheme, e.g. "https://example.com/pricing". Private and internal addresses are rejected.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function formats<R extends boolean>({
	required,
	displayName = 'Formats',
	description = 'Output formats to capture for the page: markdown, html, links, images, summary (AI summary), json (AI extraction, needs JSON Prompt), branding (colors, fonts, logos) or screenshot (pre-signed image URL valid for 1 hour).',
}: PropParams<R>) {
	return Property.StaticMultiSelectDropdown({
		displayName,
		description,
		required,
		options: { disabled: false, options: FORMAT_OPTIONS },
	});
}

function formatMode<R extends boolean>({
	required,
	displayName = 'Markdown/HTML Mode',
	description = 'Pre-processing for the markdown and html formats: normal (full page), reader (main article only) or prune (strip boilerplate). Defaults to normal.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: { disabled: false, options: MODE_OPTIONS },
	});
}

function jsonPrompt<R extends boolean>({
	required,
	displayName = 'JSON Prompt',
	description = 'Natural-language description of the data to extract. Required when the json format is selected; ignored otherwise.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function jsonSchema<R extends boolean>({
	required,
	displayName = 'JSON Schema',
	description = 'Optional JSON Schema object the json output must match, e.g. {"type":"object","properties":{"title":{"type":"string"}}}. Only used with the json format.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function fetchConfig<R extends boolean>({
	required,
	displayName = 'Fetch Config',
	description = 'Optional fetch options object: mode ("auto" default, "fast" or "js"), stealth (true for residential proxy, +5 credits), headers (object), cookies (object), scrolls (0-100), wait (ms after load, 0-30000), timeout (ms, 1000-60000), country (ISO 3166-1 alpha-2 code), e.g. {"mode":"js","wait":2000}.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function crawlId<R extends boolean>({
	required,
	displayName = 'Crawl ID',
	description = 'Crawl job UUID, returned as `id` by Start Crawl.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function monitorId<R extends boolean>({
	required,
	displayName = 'Monitor ID',
	description = 'Monitor UUID, returned as `cronId` by Create Monitor or List Monitors.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function monitorName<R extends boolean>({
	required,
	displayName = 'Name',
	description = 'Human-readable monitor name, e.g. "Pricing page watch".',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function interval<R extends boolean>({
	required,
	displayName = 'Interval',
	description = '5-field cron expression in UTC for how often to fetch, e.g. "*/30 * * * *" (every 30 minutes) or "0 9 * * 1" (Mondays 09:00).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function webhookUrl<R extends boolean>({
	required,
	displayName = 'Webhook URL',
	description = 'Optional URL that receives a POST with the captured payload on every tick.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const scrapegraphaiAiProps = {
	url,
	formats,
	formatMode,
	jsonPrompt,
	jsonSchema,
	fetchConfig,
	crawlId,
	monitorId,
	monitorName,
	interval,
	webhookUrl,
};

const FORMAT_OPTIONS = [
	{ label: 'Markdown', value: 'markdown' },
	{ label: 'HTML', value: 'html' },
	{ label: 'Links', value: 'links' },
	{ label: 'Images', value: 'images' },
	{ label: 'Summary', value: 'summary' },
	{ label: 'JSON (AI extraction)', value: 'json' },
	{ label: 'Branding', value: 'branding' },
	{ label: 'Screenshot', value: 'screenshot' },
];

const MODE_OPTIONS = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Reader', value: 'reader' },
	{ label: 'Prune', value: 'prune' },
];

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
