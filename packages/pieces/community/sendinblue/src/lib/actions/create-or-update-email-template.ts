import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { createOrUpdateEmailTemplateActionOutputSchema } from '../output-schemas';

export const createOrUpdateEmailTemplate = createAction({
	auth: sendinblueAuth,
	name: 'create_or_update_email_template',
	outputSchema: createOrUpdateEmailTemplateActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create or Update Email Template',
	description: 'Create a new Brevo email template, or update an existing one by id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Provide template_id for a safe, idempotent update of an existing template; omitting it creates a new template on every call. Creating requires template_name, subject, sender_email and either html_content or html_url. Updating only changes the fields supplied — omitted fields keep their current value.',
		idempotent: false,
	},
	props: {
		template_id: Property.Number({
			displayName: 'Template ID',
			description: 'Provide to update an existing template; omit to create a new one.',
			required: false,
		}),
		template_name: Property.ShortText({
			displayName: 'Template Name',
			description: 'Required when creating a new template.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Required when creating a new template.',
			required: false,
		}),
		sender_email: brevoProps.senderEmail,
		sender_name: Property.ShortText({
			displayName: 'Sender Name',
			required: false,
		}),
		html_content: Property.LongText({
			displayName: 'HTML Content',
			description:
				'Required when creating a new template unless HTML URL is given. Must be at least 10 characters.',
			required: false,
		}),
		html_url: Property.ShortText({
			displayName: 'HTML URL',
			description: 'URL Brevo fetches the HTML content from. Mutually exclusive with HTML Content.',
			required: false,
		}),
		reply_to_email: Property.ShortText({
			displayName: 'Reply To',
			required: false,
		}),
		to_field: Property.ShortText({
			displayName: 'To Field',
			description: 'Personalization used for the display name in the To field, for example {{contact.FIRSTNAME}}.',
			required: false,
		}),
		is_active: Property.Checkbox({
			displayName: 'Active',
			description: "Leave untouched to keep the template's current active state.",
			required: false,
		}),
		tag: Property.ShortText({
			displayName: 'Tag',
			required: false,
		}),
		attachment_url: Property.ShortText({
			displayName: 'Attachment URL',
			required: false,
		}),
	},
	async run(context) {
		const {
			template_id,
			template_name,
			subject,
			sender_email,
			sender_name,
			html_content,
			html_url,
			reply_to_email,
			to_field,
			is_active,
			tag,
			attachment_url,
		} = context.propsValue;

		const isUpdate = !isNil(template_id);

		if (!isUpdate) {
			if (isNil(template_name)) {
				throw new Error('Template Name is required when creating a new template.');
			}
			if (isNil(subject)) {
				throw new Error('Subject is required when creating a new template.');
			}
			if (isNil(sender_email)) {
				throw new Error('Sender is required when creating a new template.');
			}
			if (isNil(html_content) && isNil(html_url)) {
				throw new Error('Provide HTML Content or HTML URL when creating a new template.');
			}
			if (!isNil(html_content) && html_content.length < 10) {
				throw new Error('HTML Content must be at least 10 characters.');
			}
		}

		const body = {
			templateName: template_name,
			subject,
			sender: isNil(sender_email)
				? undefined
				: { email: sender_email, name: sender_name ?? undefined },
			htmlContent: html_content,
			htmlUrl: html_url,
			replyTo: reply_to_email,
			toField: to_field,
			isActive: is_active,
			tag,
			attachmentUrl: attachment_url,
		};

		if (isUpdate) {
			await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.PUT,
				resourceUri: `/smtp/templates/${template_id}`,
				body,
			});

			return { success: true, id: template_id };
		}

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/smtp/templates',
			body,
		});
	},
});
