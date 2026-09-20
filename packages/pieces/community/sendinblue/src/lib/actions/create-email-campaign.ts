import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { createEmailCampaignActionOutputSchema } from '../output-schemas';

export const createEmailCampaign = createAction({
	auth: sendinblueAuth,
	name: 'create_email_campaign',
	outputSchema: createEmailCampaignActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Email Campaign',
	description: 'Create a new email marketing campaign in Brevo.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Brevo email marketing campaign, either by copying an existing transactional template or by supplying a subject with HTML content, and optionally assigns recipient lists and a send schedule. Use for bulk/marketing sends; use Send Transactional Email for per-recipient transactional mail instead. Provide either a template, or a subject with HTML content/HTML URL — Brevo rejects the request otherwise. Omitting Scheduled At creates an unsent draft. Not idempotent — each call creates a new campaign.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal campaign name shown only in the Brevo dashboard, not to recipients.',
			required: true,
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
			description: 'Subject line shown to recipients. Required unless Template is selected.',
			required: false,
		}),
		template_id: Property.Number({
			displayName: 'Template ID',
			description:
				'ID of an existing Brevo transactional template whose content is copied into this campaign. Mutually exclusive with HTML Content and HTML URL.',
			required: false,
		}),
		html_content: Property.LongText({
			displayName: 'HTML Content',
			description: 'Required unless a template is selected. Mutually exclusive with HTML URL.',
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
			description: 'Schedule the send; omit to create an unsent draft.',
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
			description: 'Personalization variables available when Template is selected.',
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
			name,
			sender_email,
			sender_name,
			sender_id,
			subject,
			template_id,
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
		if (isNil(sender_id) && isNil(sender_email)) {
			throw new Error('Provide a Sender ID or Sender Email.');
		}

		const contentSourceCount = [!isNil(template_id), !isNil(html_content), !isNil(html_url)].filter(
			Boolean,
		).length;
		if (contentSourceCount === 0) {
			throw new Error('Provide a Template ID, HTML Content, or HTML URL.');
		}
		if (contentSourceCount > 1) {
			throw new Error('Provide only one of Template ID, HTML Content, or HTML URL.');
		}
		if (isNil(template_id) && isNil(subject)) {
			throw new Error('Subject is required unless Template ID is provided.');
		}

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const exclusionListIds = (exclusion_list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const body = {
			name,
			sender: buildSender({ sender_id, sender_email, sender_name }),
			subject: subject ?? undefined,
			templateId: template_id ?? undefined,
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

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/emailCampaigns',
			body,
		});
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
