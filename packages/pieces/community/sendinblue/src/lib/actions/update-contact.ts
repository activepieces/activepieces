import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';

export const updateContact = createAction({
	auth: sendinblueAuth,
	name: 'update_contact',
	classification: 'WRITE',
	displayName: 'Update Contact',
	description: 'Update an existing contact, leaving untouched fields alone.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Brevo contact identified by email, phone, contact id or external id. Only the fields you supply are sent, so anything left blank keeps its current value. This is also how you unsubscribe someone: set Blacklist From Email to Yes, and optionally list the lists to remove them from. Fails if no contact matches — use Create Contact for a new one. Idempotent: applying the same values again converges on the same contact.',
		idempotent: true,
	},
	props: {
		identifier: brevoProps.contactIdentifier,
		identifier_type: brevoProps.contactIdentifierType,
		attributes: Property.Object({
			displayName: 'Attributes',
			description:
				'Attributes to set, as key/value pairs. Attributes you omit keep their current value.',
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Add To Lists',
			description: 'Lists to add the contact to. Existing memberships are kept.',
		}),
		unlink_list_ids: brevoProps.listIds({
			displayName: 'Remove From Lists',
			description: 'Lists to remove the contact from.',
		}),
		email_blacklisted: Property.StaticDropdown<boolean>({
			displayName: 'Blacklist From Email',
			description:
				'Leave unset to keep the current setting. Yes opts the contact out of marketing email.',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		sms_blacklisted: Property.StaticDropdown<boolean>({
			displayName: 'Blacklist From SMS',
			description:
				'Leave unset to keep the current setting. Yes opts the contact out of marketing SMS.',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		ext_id: Property.ShortText({
			displayName: 'External ID',
			description: 'Your own identifier for this contact.',
			required: false,
		}),
	},
	async run(context) {
		const {
			identifier,
			identifier_type,
			attributes,
			list_ids,
			unlink_list_ids,
			email_blacklisted,
			sms_blacklisted,
			ext_id,
		} = context.propsValue;

		const listIds = toListIds(list_ids);
		const unlinkListIds = toListIds(unlink_list_ids);

		const body = {
			attributes: brevoCommon.isEmptyObject(attributes) ? undefined : attributes,
			listIds: listIds.length > 0 ? listIds : undefined,
			unlinkListIds: unlinkListIds.length > 0 ? unlinkListIds : undefined,
			emailBlacklisted: email_blacklisted,
			smsBlacklisted: sms_blacklisted,
			extId: ext_id,
		};

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}`,
			query: { identifierType: identifier_type },
			body,
		});

		return { success: true, identifier };
	},
});

function toListIds(listIds: string[] | undefined): number[] {
	return (listIds ?? [])
		.map((listId) => Number(listId))
		.filter((listId) => Number.isFinite(listId));
}
