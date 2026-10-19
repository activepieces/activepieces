import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { updateEmailCampaignActionOutputSchema } from '../output-schemas';

export const updateEmailCampaign = createAction({
	auth: sendinblueAuth,
	name: 'update_email_campaign',
	outputSchema: updateEmailCampaignActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Email Campaign',
	description: 'Update an existing Brevo email campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates fields on an existing Brevo email campaign such as its name, subject, content, recipient lists or schedule. Only the fields you provide are changed; omitted fields are left untouched. Use before Send Email Campaign Now to adjust a draft. Idempotent — re-applying the same values converges on the same state.',
		idempotent: true,
	},
	props: {
		campaign_id: Property.Number({
			displayName: 'Campaign ID',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal campaign name shown only in the Brevo dashboard, not to recipients.',
			required: false,
		}),
		sender_email: brevoProps.senderEmail,
		sender_name: Property.ShortText({
			displayName: 'Sender Name',
			description: 'Overrides the display name of the selected sender.',
			required: false,
		}),
		sender_id: Property.Number({
			displayName: 'Sender ID',
			description:
				'Alternative to Sender Email/Sender Name: an existing Brevo sender id. Provide one or the other, not both.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Subject line shown to recipients.',
			required: false,
		}),
		html_content: Property.LongText({
			displayName: 'HTML Content',
			description: 'Mutually exclusive with HTML URL.',
			required: false,
		}),
		html_url: Property.ShortText({
			displayName: 'HTML URL',
			description: 'URL Brevo fetches the HTML content from. Mutually exclusive with HTML Content.',
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Recipient Lists',
			description: 'Contact lists to send this campaign to.',
		}),
		exclusion_list_ids: brevoProps.listIds({
			displayName: 'Exclude Lists',
			description:
				'Contact lists to exclude from this campaign, even if a contact also belongs to a recipient list.',
		}),
		scheduled_at: Property.DateTime({
			displayName: 'Scheduled At',
			description: 'Schedule the send; omit to leave the current schedule untouched.',
			required: false,
		}),
		reply_to_email: Property.ShortText({
			displayName: 'Reply To',
			description: 'Email address replies are sent to, if different from the sender.',
			required: false,
		}),
		preview_text: Property.ShortText({
			displayName: 'Preview Text',
			description: 'Preheader text shown next to the subject line in most inboxes.',
			required: false,
		}),
		to_field: Property.ShortText({
			displayName: 'To Field',
			description:
				"Overrides how the recipient's name/email appears in the To field, e.g. \"{{contact.FIRSTNAME}}\".",
			required: false,
		}),
		params: Property.Object({
			displayName: 'Template Parameters',
			description: 'Personalization variables available when the campaign uses a template.',
			required: false,
		}),
		footer: Property.LongText({
			displayName: 'Footer',
			description: 'HTML footer appended to the campaign, typically the unsubscribe link and address.',
			required: false,
		}),
		header: Property.LongText({
			displayName: 'Header',
			description: 'HTML header prepended to the campaign.',
			required: false,
		}),
		utm_campaign: Property.ShortText({
			displayName: 'UTM Campaign',
			description: 'Value used for the utm_campaign tracking parameter on links in this email.',
			required: false,
		}),
	},
	async run(context) {
		const {
			campaign_id,
			name,
			sender_email,
			sender_name,
			sender_id,
			subject,
			html_content,
			html_url,
			list_ids,
			exclusion_list_ids,
			scheduled_at,
			reply_to_email,
			preview_text,
			to_field,
			params,
			footer,
			header,
			utm_campaign,
		} = context.propsValue;

		if (!isNil(sender_id) && !isNil(sender_email)) {
			throw new Error('Provide Sender ID or Sender Email, not both.');
		}

		if (!isNil(html_content) && !isNil(html_url)) {
			throw new Error('Provide HTML Content or HTML URL, not both.');
		}

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const exclusionListIds = (exclusion_list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const body = {
			name: name ?? undefined,
			sender: buildSender({ sender_id, sender_email, sender_name }),
			subject: subject ?? undefined,
			htmlContent: html_content ?? undefined,
			htmlUrl: html_url ?? undefined,
			recipients:
				listIds.length > 0 || exclusionListIds.length > 0
					? {
							listIds: listIds.length > 0 ? listIds : undefined,
							exclusionListIds: exclusionListIds.length > 0 ? exclusionListIds : undefined,
					  }
					: undefined,
			scheduledAt: scheduled_at ?? undefined,
			replyTo: reply_to_email ?? undefined,
			previewText: preview_text ?? undefined,
			toField: to_field ?? undefined,
			params: brevoCommon.isEmptyObject(params) ? undefined : params,
			footer: footer ?? undefined,
			header: header ?? undefined,
			utmCampaign: utm_campaign ?? undefined,
		};

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/emailCampaigns/${campaign_id}`,
			body,
		});

		return { success: true };
	},
});

function buildSender({
	sender_id,
	sender_email,
	sender_name,
}: {
	sender_id: number | undefined;
	sender_email: string | undefined;
	sender_name: string | undefined;
}): { id: number } | { email: string; name?: string } | undefined {
	if (!isNil(sender_id)) {
		return { id: sender_id };
	}
	if (!isNil(sender_email)) {
		return { email: sender_email, name: sender_name ?? undefined };
	}
	return undefined;
}
