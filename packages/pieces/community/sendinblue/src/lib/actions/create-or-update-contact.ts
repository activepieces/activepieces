import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { contactFlags } from '../common/contact-flags';
import { brevoProps } from '../common/props';
import { createOrUpdateContactActionOutputSchema } from '../output-schemas';

export const createOrUpdateContact = createAction({
	auth: sendinblueAuth,
	name: 'create_or_update_contact',
	outputSchema: createOrUpdateContactActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create or Update Contact',
	description: 'Create a contact, or update it if the email already exists.',
	audience: 'both',
	aiMetadata: {
		description:
			'Upserts a Brevo (formerly Sendinblue) contact keyed on its email address, setting attributes, list membership, and email/SMS blacklist flags. Use to add a new subscriber or sync changes to an existing one; because it is keyed on email with update enabled, re-running with the same input is idempotent and does not create duplicates. Email is required, and any attributes referenced must already exist in the Brevo account. Blacklist flags are only sent when explicitly set, so leaving them untouched preserves the contact current subscription state.',
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'contact',
			display: 'section',
			label: 'Contact',
			icon: 'user',
			props: ['changes_note', 'email', 'ext_id', 'attributes'],
		},
		{
			key: 'subscriptions',
			display: 'section',
			label: 'Subscriptions',
			icon: 'inbox',
			props: ['list_ids', 'email_blacklisted', 'sms_blacklisted', 'blocked_sender_addresses'],
		},
	],
	props: {
		changes_note: Property.MarkDown({
			value: 'Empty fields keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The contact is matched by this address.',
			placeholder: 'jane@example.com',
			required: true,
			width: 'half',
		}),
		ext_id: Property.ShortText({
			displayName: 'External ID',
			description: 'Your own ID for this contact.',
			placeholder: 'crm-1042',
			required: false,
			width: 'half',
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description: 'Use attribute names from your Brevo account, such as FIRSTNAME.',
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Add to Lists',
			description: 'The contact stays on lists it is already in.',
		}),
		email_blacklisted: Property.Checkbox({
			displayName: 'Unsubscribe From Email',
			description: 'Unticked keeps the current setting.',
			required: false,
		}),
		sms_blacklisted: Property.Checkbox({
			displayName: 'Unsubscribe From SMS',
			description: 'Unticked keeps the current setting.',
			required: false,
		}),
		blocked_sender_addresses: Property.Array({
			displayName: 'Blocked Sender Addresses',
			description: 'Senders whose transactional emails this contact will not get.',
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
			emailBlacklisted: contactFlags.blacklistFlag(email_blacklisted),
			smsBlacklisted: contactFlags.blacklistFlag(sms_blacklisted),
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
