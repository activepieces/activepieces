import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateCampaignDraftAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_campaign_draft',
	outputSchema: mailjetCampaignDraftOutputSchema,
	displayName: 'Update Campaign Draft',
	description: 'Updates a campaign draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the settings of a campaign draft that has not been sent. Only the fields you set change. Content is changed with Set Campaign Draft Content.',
		idempotent: true,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'New subject line.',
			required: false,
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Locale, e.g. "en_US".',
			required: false,
		}),
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Numeric ID of the list to send to.',
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
			description: 'Validated sender address.',
			required: false,
		}),
		senderName: Property.ShortText({
			displayName: 'Sender Name',
			description: 'Sender display name.',
			required: false,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Internal title.',
			required: false,
		}),
		replyEmail: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'Address replies go to.',
			required: false,
		}),
		segmentationId: Property.Number({
			displayName: 'Segment ID',
			description: 'Segment to target, from List Segments.',
			required: false,
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes stars the draft, No unstars it.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}`,
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
				IsStarred: p.isStarred,
			},
		});
	},
});
