import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { createContactActionOutputSchema } from '../output-schemas';

export const createContact = createAction({
	auth: sendinblueAuth,
	name: 'create_contact',
	outputSchema: createContactActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Contact',
	description: 'Create a new contact, failing if one already exists.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Brevo contact from an email address, optionally with attributes and list membership. Fails with a duplicate error if the email already exists — use Update Contact to change an existing one, or Get Contact first if you are unsure which applies. Any attribute you set must already be configured on the account; List Contact Attributes shows which exist. Not idempotent: a second call with the same email is rejected rather than merged.',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address of the contact to create.',
			required: true,
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description:
				'Contact attributes as key/value pairs, for example FIRSTNAME or LASTNAME. Each key must already exist on the account.',
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Add To Lists',
			description: 'Lists the new contact is added to.',
		}),
		ext_id: Property.ShortText({
			displayName: 'External ID',
			description: 'Your own identifier for this contact.',
			required: false,
		}),
		email_blacklisted: Property.Checkbox({
			displayName: 'Blacklist From Email',
			description: 'Create the contact already opted out of marketing email.',
			required: false,
		}),
		sms_blacklisted: Property.Checkbox({
			displayName: 'Blacklist From SMS',
			description: 'Create the contact already opted out of marketing SMS.',
			required: false,
		}),
	},
	async run(context) {
		const {
			email,
			attributes,
			list_ids,
			ext_id,
			email_blacklisted,
			sms_blacklisted,
		} = context.propsValue;

		const listIds = toListIds(list_ids);

		const body = {
			email,
			attributes: brevoCommon.isEmptyObject(attributes) ? undefined : attributes,
			listIds: listIds.length > 0 ? listIds : undefined,
			extId: ext_id,
			emailBlacklisted: email_blacklisted,
			smsBlacklisted: sms_blacklisted,
		};

		try {
			const created = await brevoCommon.apiCall<CreateContactResponse>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.POST,
				resourceUri: '/contacts',
				body,
			});

			return { created: true, id: created?.id, email };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 400) {
				throw new Error(
					`Brevo rejected the contact "${email}". A contact with this email or external id already exists — use Update Contact to change it.`,
				);
			}
			throw error;
		}
	},
});

function toListIds(listIds: string[] | undefined): number[] {
	return (listIds ?? [])
		.map((listId) => Number(listId))
		.filter((listId) => Number.isFinite(listId));
}

type CreateContactResponse = {
	id?: number;
};
