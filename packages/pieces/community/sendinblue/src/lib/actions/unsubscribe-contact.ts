import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { contactFlags } from '../common/contact-flags';
import { brevoProps } from '../common/props';

export const unsubscribeContact = createAction({
	auth: sendinblueAuth,
	name: 'unsubscribe_contact',
	classification: 'WRITE',
	displayName: 'Unsubscribe Contact',
	description: 'Blacklist a contact so it stops receiving email or SMS.',
	audience: 'both',
	aiMetadata: {
		description:
			'Opts a Brevo contact out by setting its email and optionally SMS blacklist flags, and can additionally remove it from specific lists. Use this to honour an unsubscribe request received elsewhere. Brevo answers with an empty body, so this returns a success flag. Idempotent — unsubscribing an already unsubscribed contact changes nothing.',
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'contact',
			display: 'section',
			label: 'Contact',
			icon: 'user',
			props: ['email'],
		},
		{
			key: 'opt_out',
			display: 'section',
			label: 'Opt Out',
			icon: 'inbox',
			props: ['unsubscribe_email', 'unsubscribe_sms', 'unlink_list_ids'],
		},
	],
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The contact is matched by this address.',
			placeholder: 'jane@example.com',
			required: true,
		}),
		unsubscribe_email: Property.Checkbox({
			displayName: 'Unsubscribe From Email',
			description: 'Unticked keeps the current setting.',
			required: false,
			defaultValue: true,
		}),
		unsubscribe_sms: Property.Checkbox({
			displayName: 'Unsubscribe From SMS',
			description: 'Unticked keeps the current setting.',
			required: false,
		}),
		unlink_list_ids: brevoProps.listIds({
			displayName: 'Remove From Lists',
			description: 'Lists to take the contact off.',
		}),
	},
	async run(context) {
		const { email, unsubscribe_email, unsubscribe_sms, unlink_list_ids } =
			context.propsValue;

		const unlinkListIds = (unlink_list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const body = contactFlags.unsubscribeBody({
			unsubscribeEmail: unsubscribe_email,
			unsubscribeSms: unsubscribe_sms,
			unlinkListIds,
		});

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/contacts/${encodeURIComponent(email)}`,
			body,
		});

		return { success: true };
	},
});
