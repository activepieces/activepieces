import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { campaignWriteOutputSchema } from '../output-schemas';

function toIdList(value: unknown[] | undefined): string[] {
	return (value ?? []).map((item) => String(item).trim()).filter((item) => item.length > 0);
}

export const createCampaignDraftAction = createAction({
	auth: mailerLiteAuth,
	name: 'create_campaign_draft',
	classification: 'WRITE',
	displayName: 'Create Campaign Draft',
	description: 'Create a regular email campaign as a draft. It is never sent.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create a regular MailerLite email campaign as a draft only; it is never sent or scheduled, sending is done in the MailerLite dashboard. from must be a verified sender email on the account. Target it with group_ids (from list_groups) and/or segment_ids (from list_segments); with neither, the draft has no audience yet. language_id comes from list_campaign_languages. content (HTML) works on the Advanced plan only; omit it on other plans. Not idempotent: each call creates another draft.',
		idempotent: false,
	},
	outputSchema: campaignWriteOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'Internal campaign name.',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject line.',
			required: true,
		}),
		from_name: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender name shown to recipients.',
			required: true,
		}),
		from: Property.ShortText({
			displayName: 'From Email',
			description: 'Sender email. Must be a verified sender on the MailerLite account.',
			required: true,
		}),
		reply_to: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'Reply-to email address.',
			required: false,
		}),
		group_ids: Property.Array({
			displayName: 'Group IDs',
			description: 'Groups to send to, from list_groups.',
			required: false,
		}),
		segment_ids: Property.Array({
			displayName: 'Segment IDs',
			description: 'Segments to send to, from list_segments.',
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
		const { name, subject, from_name, from, reply_to, language_id, content } = context.propsValue;
		const email: Record<string, string> = { subject, from_name, from };
		if (reply_to) {
			email['reply_to'] = reply_to;
		}
		if (content) {
			email['content'] = content;
		}
		const body: Record<string, unknown> = { name, type: 'regular', emails: [email] };
		const groups = toIdList(context.propsValue.group_ids);
		const segments = toIdList(context.propsValue.segment_ids);
		if (groups.length > 0) {
			body['groups'] = groups;
		}
		if (segments.length > 0) {
			body['segments'] = segments;
		}
		if (language_id) {
			body['language_id'] = language_id;
		}
		const response = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/campaigns',
			body,
		});
		return mailerLiteApi.unwrapData(response);
	},
});
