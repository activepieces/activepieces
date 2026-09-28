import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { updateContactActionOutputSchema } from '../output-schemas';

export const updateContact = createAction({
	auth: sendinblueAuth,
	name: 'update_contact',
	outputSchema: updateContactActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Contact',
	description: 'Update an existing Brevo contact by email, phone, contact id, external id, WhatsApp id, or landline number.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Brevo contact identified by email, phone number, contact id, external id, WhatsApp id or landline number, setting attributes, list membership, blacklist flags, or a new external id. This complements create_or_update_contact: use create_or_update_contact when you only have an email and want create-or-update semantics; use update_contact when you need to update by an identifier other than email, or want a hard 404 failure instead of silently creating a new contact. Idempotent — re-applying the same values converges on the same contact state.',
		idempotent: true,
	},
	props: {
		identifier: Property.ShortText({
			displayName: 'Identifier',
			description: 'The value to look the contact up by, for example an email address.',
			required: true,
		}),
		identifier_type: Property.StaticDropdown({
			displayName: 'Identifier Type',
			description: 'How the identifier above should be interpreted.',
			required: false,
			defaultValue: 'email_id',
			options: {
				options: [
					{ label: 'Email', value: 'email_id' },
					{ label: 'Phone (SMS)', value: 'phone_id' },
					{ label: 'Contact ID', value: 'contact_id' },
					{ label: 'External ID', value: 'ext_id' },
					{ label: 'WhatsApp', value: 'whatsapp_id' },
					{ label: 'Landline Number', value: 'landline_number_id' },
				],
			},
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description: `Pass the set of attributes and their values. Attribute names must already exist in your Brevo account and be passed in capital letters, for eg: {"FNAME":"Elly", "LNAME":"Roger"}. Only the attributes you list are changed; the rest are left as they are.`,
			required: false,
		}),
		ext_id: Property.ShortText({
			displayName: 'External ID',
			description: 'Sets a new external id for the contact.',
			required: false,
		}),
		email_blacklisted: Property.Checkbox({
			displayName: 'Email Blacklisted?',
			description: `Set this field to blacklist the contact for emails (emailBlacklisted = true). Leave untouched to keep the contact's current setting.`,
			required: false,
		}),
		sms_blacklisted: Property.Checkbox({
			displayName: 'SMS Blacklisted?',
			description: `Set this field to blacklist the contact for SMS (smsBlacklisted = true). Leave untouched to keep the contact's current setting.`,
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Add to Lists',
			description: 'Lists to add the contact to.',
		}),
		unlink_list_ids: brevoProps.listIds({
			displayName: 'Remove from Lists',
			description: 'Lists to remove the contact from.',
		}),
		blocked_sender_addresses: Property.Array({
			displayName: 'Blocked Sender Addresses',
			description: `Sender email addresses this contact must not receive transactional email from. Leave empty to change nothing.`,
			required: false,
		}),
	},
	async run(context) {
		const {
			identifier,
			identifier_type,
			attributes,
			ext_id,
			email_blacklisted,
			sms_blacklisted,
			list_ids,
			unlink_list_ids,
			blocked_sender_addresses,
		} = context.propsValue;

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const unlinkListIds = (unlink_list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const blockedSenders = (Array.isArray(blocked_sender_addresses) ? blocked_sender_addresses : [])
			.map((sender) => String(sender).trim())
			.filter((sender) => sender.length > 0);

		const body = {
			ext_id,
			attributes: brevoCommon.isEmptyObject(attributes) ? undefined : attributes,
			emailBlacklisted: email_blacklisted,
			smsBlacklisted: sms_blacklisted,
			listIds: listIds.length > 0 ? listIds : undefined,
			unlinkListIds: unlinkListIds.length > 0 ? unlinkListIds : undefined,
			smtpBlacklistSender: blockedSenders.length > 0 ? blockedSenders : undefined,
		};

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}`,
			query: { identifierType: identifier_type },
			body,
		});

		return { success: true };
	},
});
