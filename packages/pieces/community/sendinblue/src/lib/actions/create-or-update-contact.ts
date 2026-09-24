import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { createOrUpdateContactActionOutputSchema } from '../output-schemas';

export const createOrUpdateContact = createAction({
	auth: sendinblueAuth,
	name: 'create_or_update_contact',
	outputSchema: createOrUpdateContactActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create or Update Contact',
	description: 'Create or update an existing contact',
	audience: 'both',
	aiMetadata: {
		description:
			'Upserts a Brevo (formerly Sendinblue) contact keyed on its email address, setting attributes, list membership, and email/SMS blacklist flags. Use to add a new subscriber or sync changes to an existing one; because it is keyed on email with update enabled, re-running with the same input is idempotent and does not create duplicates. Email is required, and any attributes referenced must already exist in the Brevo account. Blacklist flags are only sent when explicitly set, so leaving them untouched preserves the contact current subscription state.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: `Email address of the user. Mandatory if "SMS" field is not passed in "attributes" parameter. Mobile Number in SMS field should be passed with proper country code. For example: {"SMS":"+91xxxxxxxxxx"} or {"SMS":"0091xxxxxxxxxx"}`,
			required: true,
		}),
		ext_id: Property.ShortText({
			displayName: 'External ID',
			description: `Pass your own Id to create a contact.`,
			required: false,
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description: `Pass the set of attributes and their values. The attribute's parameter should be passed in capital letter while creating a contact. These attributes must be present in your Brevo account. For eg:
        {"FNAME":"Elly", "LNAME":"Roger"}. Only the attributes you list are changed; the rest are left as they are.`,
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
			displayName: 'Lists',
			description: 'Lists to add the contact to.',
		}),
		blocked_sender_addresses: Property.Array({
			displayName: 'Blocked Sender Addresses',
			description: `Sender email addresses this contact must not receive transactional email from. Leave empty to change nothing.`,
			required: false,
		}),
	},
	async run(context) {
		const {
			email,
			ext_id,
			attributes,
			email_blacklisted,
			sms_blacklisted,
			list_ids,
			blocked_sender_addresses,
		} = context.propsValue;

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const blockedSenders = (Array.isArray(blocked_sender_addresses) ? blocked_sender_addresses : [])
			.map((sender) => String(sender).trim())
			.filter((sender) => sender.length > 0);

		const contact = {
			email,
			ext_id,
			attributes: brevoCommon.isEmptyObject(attributes) ? undefined : attributes,
			emailBlacklisted: email_blacklisted,
			smsBlacklisted: sms_blacklisted,
			listIds: listIds.length > 0 ? listIds : undefined,
			smtpBlacklistSender: blockedSenders.length > 0 ? blockedSenders : undefined,
			updateEnabled: true,
		};

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/contacts',
			body: contact,
		});

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/contacts/${encodeURIComponent(email)}`,
		});
	},
});

