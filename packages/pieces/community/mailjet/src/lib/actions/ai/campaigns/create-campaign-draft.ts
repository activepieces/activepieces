import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftWithTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateCampaignDraftAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_campaign_draft',
	outputSchema: mailjetCampaignDraftWithTemplateOutputSchema,
	displayName: 'Create Campaign Draft',
	description: 'Creates a campaign draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a marketing campaign draft for a contact list. Set its content with Set Campaign Draft Content, then send it with Send Campaign Draft or schedule it with Schedule Campaign Draft. Sender Email must be a validated sender.',
		idempotent: false,
	},
	props: {
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Subject line of the campaign.',
			required: true,
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Locale of the campaign, e.g. "en_US".',
			required: true,
		}),
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description:
				'Numeric ID of the list to send to, from List Contact Lists. Required before sending.',
			required: false,
		}),
		senderId: Property.ShortText({
			displayName: 'Sender ID',
			description:
				'Numeric ID of the validated sender, from List Senders. Needed to reschedule the draft with Update Campaign Draft Schedule.',
			required: false,
		}),
		senderEmail: Property.ShortText({
			displayName: 'Sender Email',
			description: 'Validated sender address. Required before sending.',
			required: false,
		}),
		senderName: Property.ShortText({
			displayName: 'Sender Name',
			description: 'Sender display name.',
			required: false,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Internal title of the draft.',
			required: false,
		}),
		replyEmail: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'Address replies go to.',
			required: false,
		}),
		segmentationId: Property.Number({
			displayName: 'Segment ID',
			description: 'Optional segment, from List Segments, to target part of the list.',
			required: false,
		}),
		templateId: Property.Number({
			displayName: 'Template ID',
			description:
				'Optional template the draft is based on: the ExternalID field from Get Template or List Templates, not their ID field.',
			required: false,
		}),
		editMode: Property.StaticDropdown({
			displayName: 'Edit Mode',
			description: 'Editor of the content: tool2 (drag and drop), html2 (HTML) or mjml.',
			required: false,
			options: {
				options: [
					{ label: 'tool2', value: 'tool2' },
					{ label: 'html2', value: 'html2' },
					{ label: 'mjml', value: 'mjml' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/campaigndraft',
			body: {
				Subject: p.subject,
				Locale: p.locale,
				ContactsListID: p.contactsListId,
				Sender: p.senderId,
				SenderEmail: p.senderEmail,
				SenderName: p.senderName,
				Title: p.title,
				ReplyEmail: p.replyEmail,
				SegmentationID: p.segmentationId,
				TemplateID: p.templateId,
				EditMode: p.editMode,
			},
		});
	},
});
