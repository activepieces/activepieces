import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { requireText } from '../common/lookups';
import { contactOutputSchema } from '../output-schemas';

export const updateContactAction = createAction({
	auth: intercomAuth,
	name: 'update_contact',
	classification: 'WRITE',
	displayName: 'Update Contact',
	description: "Updates a contact's role, email, name, phone, external ID, owner, subscription or custom attributes.",
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates one contact by Intercom ID: role, email, name, phone, external ID, owner, email subscription or custom attributes. Omitted fields stay as they are; list a field under Clear Fields to blank it. Setting the same values again changes nothing, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The Intercom contact ID (see Search Contacts or Get Contact).',
			required: true,
		}),
		role: Property.StaticDropdown({
			displayName: 'Role',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'User', value: 'user' },
					{ label: 'Lead', value: 'lead' },
				],
			},
		}),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', required: false }),
		externalId: Property.ShortText({ displayName: 'External ID', required: false }),
		ownerId: Property.ShortText({ displayName: 'Owner Admin ID', required: false }),
		unsubscribed: Property.StaticDropdown({
			displayName: 'Email Subscription',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Subscribed', value: 'subscribed' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
				],
			},
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			description: 'Custom attributes by name. Only the ones you list change.',
			required: false,
		}),
		clearFields: Property.StaticMultiSelectDropdown({
			displayName: 'Clear Fields',
			description: 'Fields to blank on the contact.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Name', value: 'name' },
					{ label: 'Phone', value: 'phone' },
					{ label: 'External ID', value: 'external_id' },
					{ label: 'Owner', value: 'owner_id' },
				],
			},
		}),
	},
	outputSchema: contactOutputSchema,
	async run(context) {
		const p = context.propsValue;
		const contactId = requireText({ label: 'Contact ID', value: p.contactId });
		const clear = new Set(p.clearFields ?? []);
		const set: Record<string, unknown> = {
			...(p.role ? { role: p.role } : {}),
			...(p.email?.trim() ? { email: p.email.trim() } : {}),
			...(p.name?.trim() ? { name: p.name.trim() } : {}),
			...(p.phone?.trim() ? { phone: p.phone.trim() } : {}),
			...(p.externalId?.trim() ? { external_id: p.externalId.trim() } : {}),
			...(p.ownerId?.trim() ? { owner_id: toOwnerId(p.ownerId.trim()) } : {}),
			...(p.unsubscribed ? { unsubscribed_from_emails: p.unsubscribed === 'unsubscribed' } : {}),
			...(p.customAttributes && Object.keys(p.customAttributes).length > 0 ? { custom_attributes: p.customAttributes } : {}),
		};
		const conflicts = [...clear].filter((field) => field in set);
		if (conflicts.length > 0) {
			throw new Error(`Do not set and clear the same field: ${conflicts.join(', ')}.`);
		}
		const body = { ...set, ...Object.fromEntries([...clear].map((field) => [field, null])) };
		if (Object.keys(body).length === 0) {
			throw new Error('Nothing to update. Set or clear at least one field.');
		}
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: ['contacts', contactId],
			body,
			operation: 'update the contact',
		});
	},
});

function toOwnerId(value: string): number {
	const numeric = Number(value);
	if (!Number.isInteger(numeric) || numeric < 0) {
		throw new Error('Owner Admin ID must be a numeric admin ID.');
	}
	return numeric;
}
