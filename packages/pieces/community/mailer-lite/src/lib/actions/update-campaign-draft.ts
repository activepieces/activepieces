import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { campaignWriteOutputSchema } from '../output-schemas';

function idsOf(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((item) => (mailerLiteApi.isRecord(item) ? item['id'] : item))
		.filter((item) => typeof item === 'string' && item !== '')
		.map(String);
}

function idsFromFilter({ filter, kind }: { filter: unknown; kind: 'groups' | 'segments' }): string[] {
	if (!Array.isArray(filter)) {
		return [];
	}
	const ids = filter
		.flatMap((clause: unknown) => (Array.isArray(clause) ? clause : [clause]))
		.flatMap((rule: unknown) => {
			if (!mailerLiteApi.isRecord(rule) || rule['operator'] !== 'in_any' || !Array.isArray(rule['args'])) {
				return [];
			}
			const [target, values] = rule['args'];
			return target === kind && Array.isArray(values) ? values.map(String) : [];
		});
	return Array.from(new Set(ids));
}

function currentIds({ current, kind }: { current: Record<string, unknown>; kind: 'groups' | 'segments' }): string[] {
	const fromFilter = idsFromFilter({ filter: current['filter'], kind });
	return fromFilter.length > 0 ? fromFilter : idsOf(current[kind]);
}

function toIdList(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const ids = value.map((item) => String(item).trim()).filter((item) => item.length > 0);
	return ids.length > 0 ? ids : undefined;
}

function textOf(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const updateCampaignDraftAction = createAction({
	auth: mailerLiteAuth,
	name: 'update_campaign_draft',
	classification: 'WRITE',
	displayName: 'Update Campaign Draft',
	description: 'Update a draft campaign, keeping the values you do not change.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Update a MailerLite campaign that is still a draft, changing only the values you supply; everything else (name, subject, sender, groups, segments, language) is kept. Fails if the campaign is not a draft. It never sends or schedules. Get the ID from list_campaigns with status draft. Group and segment lists replace the current ones. content (HTML) works on the Advanced plan only. At least one value is required. Idempotent.',
		idempotent: true,
	},
	outputSchema: campaignWriteOutputSchema,
	props: {
		campaign_id: Property.ShortText({
			displayName: 'Campaign ID',
			description: 'The draft campaign ID, from list_campaigns.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'New internal campaign name.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'New email subject line.',
			required: false,
		}),
		from_name: Property.ShortText({
			displayName: 'From Name',
			description: 'New sender name.',
			required: false,
		}),
		from: Property.ShortText({
			displayName: 'From Email',
			description: 'New sender email. Must be a verified sender on the MailerLite account.',
			required: false,
		}),
		reply_to: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'New reply-to email address.',
			required: false,
		}),
		group_ids: Property.Array({
			displayName: 'Group IDs',
			description: 'Replaces the groups to send to, from list_groups.',
			required: false,
		}),
		segment_ids: Property.Array({
			displayName: 'Segment IDs',
			description: 'Replaces the segments to send to, from list_segments.',
			required: false,
		}),
		language_id: Property.ShortText({
			displayName: 'Language ID',
			description: 'Campaign language ID, from list_campaign_languages.',
			required: false,
		}),
		content: Property.LongText({
			displayName: 'HTML Content',
			description: 'Email HTML. Advanced plan only; omit on other plans.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.campaign_id, label: 'Campaign ID' });
		const props = context.propsValue;
		const groupPatch = toIdList(props.group_ids);
		const segmentPatch = toIdList(props.segment_ids);
		const hasPatch =
			[props.name, props.subject, props.from_name, props.from, props.reply_to, props.language_id, props.content].some(
				(value) => typeof value === 'string' && value.length > 0,
			) ||
			groupPatch !== undefined ||
			segmentPatch !== undefined;
		if (!hasPatch) {
			throw new Error('Provide at least one value to update.');
		}
		const current = mailerLiteApi.unwrapData(
			await mailerLiteApi.request<unknown>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				path: `/campaigns/${id}`,
				resource: `campaign ${id}`,
			}),
		);
		if (current['status'] !== 'draft') {
			throw new Error(`Campaign ${id} is not a draft (status: ${String(current['status'])}); only drafts can be updated.`);
		}
		const emails = current['emails'];
		const firstEmail = Array.isArray(emails) && mailerLiteApi.isRecord(emails[0]) ? emails[0] : {};
		const email: Record<string, string> = {};
		const subject = props.subject || textOf(firstEmail['subject']);
		const fromName = props.from_name || textOf(firstEmail['from_name']);
		const from = props.from || textOf(firstEmail['from']);
		const replyTo = props.reply_to || textOf(firstEmail['reply_to']);
		if (subject) {
			email['subject'] = subject;
		}
		if (fromName) {
			email['from_name'] = fromName;
		}
		if (from) {
			email['from'] = from;
		}
		if (replyTo) {
			email['reply_to'] = replyTo;
		}
		const content = props.content || textOf(firstEmail['content']);
		if (content) {
			email['content'] = content;
		}
		const body: Record<string, unknown> = {
			name: props.name || textOf(current['name']),
			emails: [email],
		};
		const groups = groupPatch ?? currentIds({ current, kind: 'groups' });
		const segments = segmentPatch ?? currentIds({ current, kind: 'segments' });
		if (groups.length > 0) {
			body['groups'] = groups;
		}
		if (segments.length > 0) {
			body['segments'] = segments;
		}
		const languageId = props.language_id || current['language_id'];
		if (languageId !== undefined && languageId !== null && languageId !== '') {
			body['language_id'] = String(languageId);
		}
		const response = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/campaigns/${id}`,
			resource: `campaign ${id}`,
			body,
		});
		return mailerLiteApi.unwrapData(response);
	},
});
