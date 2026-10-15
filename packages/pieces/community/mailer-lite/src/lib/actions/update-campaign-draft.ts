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

function inclusionOf(rule: unknown): { kind: 'groups' | 'segments'; ids: string[] } | null {
	if (!mailerLiteApi.isRecord(rule) || rule['operator'] !== 'in_any' || !Array.isArray(rule['args'])) {
		return null;
	}
	const [target, values] = rule['args'];
	if ((target !== 'groups' && target !== 'segments') || !Array.isArray(values)) {
		return null;
	}
	return { kind: target, ids: values.map(String) };
}

function currentTargeting(current: Record<string, unknown>): Targeting {
	const filter = current['filter'];
	if (!Array.isArray(filter) || filter.length === 0) {
		return { groups: idsOf(current['groups']), segments: idsOf(current['segments']), representable: true };
	}
	const rules = filter.flatMap((clause: unknown) => (Array.isArray(clause) ? clause : [clause]));
	const inclusions = rules.map(inclusionOf);
	const idsFor = (kind: 'groups' | 'segments'): string[] =>
		Array.from(new Set(inclusions.flatMap((inclusion) => (inclusion?.kind === kind ? inclusion.ids : []))));
	return {
		groups: idsFor('groups'),
		segments: idsFor('segments'),
		representable: inclusions.every((inclusion) => inclusion !== null),
	};
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
			'Update a MailerLite campaign that is still a draft, changing only the values you supply; everything else (name, subject, sender, groups, segments, language) is kept. Fails if the campaign is not a draft. It never sends or schedules. Get the ID from list_campaigns with status draft. Pass group_ids or segment_ids (not both) to replace the audience. Fails without changing anything if the campaign excludes groups or segments, or targets both groups and segments and you pass neither, because the MailerLite API cannot save those rules back. content (HTML) works on the Advanced plan only. At least one value is required. Idempotent.',
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
			description: 'Replaces the audience with these groups, from list_groups. Not with Segment IDs.',
			required: false,
		}),
		segment_ids: Property.Array({
			displayName: 'Segment IDs',
			description: 'Replaces the audience with these segments, from list_segments. Not with Group IDs.',
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
		if (groupPatch !== undefined && segmentPatch !== undefined) {
			throw new Error('Provide Group IDs or Segment IDs, not both: MailerLite only sends to the segments when both are set.');
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
		const targeting = currentTargeting(current);
		if (!targeting.representable) {
			throw new Error(
				`Campaign ${id} uses audience rules the MailerLite API cannot save back, such as excluded groups or segments. Update it in MailerLite instead so those rules are not lost.`,
			);
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
		if (groupPatch !== undefined) {
			body['groups'] = groupPatch;
		} else if (segmentPatch !== undefined) {
			body['segments'] = segmentPatch;
		} else if (targeting.segments.length > 0) {
			if (targeting.groups.length > 0) {
				throw new Error(
					`Campaign ${id} targets both groups and segments, which the MailerLite API cannot save back together. Pass Group IDs or Segment IDs to choose the audience.`,
				);
			}
			body['segments'] = targeting.segments;
		} else if (targeting.groups.length > 0) {
			body['groups'] = targeting.groups;
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

type Targeting = {
	groups: string[];
	segments: string[];
	representable: boolean;
};
