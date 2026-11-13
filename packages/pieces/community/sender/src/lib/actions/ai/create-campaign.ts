import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderCampaignWriteOutputSchema } from '../../output-schemas';

const UNSUBSCRIBE_FOOTER = '<p><a href="{{unsubscribe_link}}">{{unsubscribe_text}}</a></p>';

export const senderCreateCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_create_campaign',
	outputSchema: senderCampaignWriteOutputSchema,
	displayName: 'Create Campaign',
	description: 'Creates a draft email campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a draft email campaign for the given groups and/or segments, with subject, sender name, reply-to email and HTML or plain-text content. Nothing is sent: follow with Send Campaign. Reply To must be on a sending domain with SPF and DKIM set up in Sender. HTML content gets the unsubscribe link Sender requires appended automatically. Each call creates a separate draft.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'Internal name shown in reports.',
			required: false,
		}),
		subject: Property.ShortText({ displayName: 'Subject', required: true }),
		from: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender name shown to subscribers.',
			required: true,
		}),
		replyTo: Property.ShortText({
			displayName: 'Reply To',
			description: 'Sender email address, on a verified domain in the account.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description:
				'html or text to pass Content here; editor creates a drag-and-drop draft to finish in Sender.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Plain text', value: 'text' },
					{ label: 'Editor', value: 'editor' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Email body as HTML or plain text, matching Content Type.',
			required: false,
		}),
		preheader: Property.ShortText({
			displayName: 'Preheader',
			description: 'Preview text shown after the subject in inboxes.',
			required: false,
		}),
		groups: senderAiProps.groups({
			required: false,
			description: 'Group IDs to send to, e.g. ["eZVD4w"]. Use List Groups.',
		}),
		segments: Property.Array({
			displayName: 'Segment IDs',
			description: 'Segment IDs to send to. Use List Segments.',
			required: false,
		}),
		googleAnalytics: senderAiProps.yesNo({
			required: false,
			displayName: 'Google Analytics',
			description: 'Add Google Analytics tracking to links.',
		}),
		autoFollowupActive: senderAiProps.yesNo({
			required: false,
			displayName: 'Auto Follow-up',
			description: 'Resend automatically to subscribers who did not open.',
		}),
		autoFollowupSubject: Property.ShortText({ displayName: 'Follow-up Subject', required: false }),
		autoFollowupDelay: Property.StaticDropdown<number>({
			displayName: 'Follow-up Delay (hours)',
			description: 'Hours to wait before the follow-up.',
			required: false,
			options: {
				disabled: false,
				options: [12, 24, 48, 72, 96, 120, 144, 168].map((hours) => ({
					label: String(hours),
					value: hours,
				})),
			},
		}),
	},
	async run(context) {
		const {
			googleAnalytics,
			autoFollowupActive,
			groups,
			segments,
			contentType,
			content,
			...props
		} = context.propsValue;
		const analytics = senderUtils.yesNoToBoolean(googleAnalytics);
		return await senderApi.createCampaign({
			auth: context.auth,
			...props,
			contentType,
			content: contentType === 'html' && content ? withUnsubscribeLink({ html: content }) : content,
			groups: senderUtils.optionalStringList({ value: groups, propName: 'Group IDs' }),
			segments: senderUtils.optionalStringList({ value: segments, propName: 'Segment IDs' }),
			googleAnalytics: analytics === undefined ? undefined : Number(analytics),
			autoFollowupActive: senderUtils.yesNoToBoolean(autoFollowupActive),
		});
	},
});

function withUnsubscribeLink({ html }: { html: string }): string {
	return html.includes('</body>')
		? html.replace('</body>', `${UNSUBSCRIBE_FOOTER}</body>`)
		: `${html}${UNSUBSCRIBE_FOOTER}`;
}
