import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { requireText } from '../../common/lookups';
import { getTicketTypeAttributes, toTicketAttributes } from '../../common/ticket-attributes';
import { ticketOutputSchema } from '../../output-schemas';

export const createTicketByTypeIdAction = createAction({
	auth: intercomAuth,
	name: 'create_ticket_by_type_id',
	classification: 'WRITE',
	displayName: 'Create Ticket (by Type ID)',
	description: 'Creates a ticket of a given ticket type for one contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a ticket of a given ticket type for one contact (by contact ID, email or external ID). An email that matches no contact makes Intercom create a new contact for it, so look the contact up first if that is not wanted. Call List Ticket Types first to get the type ID and its attribute names; list attributes take the option ID, dates take ISO 8601. Each call creates another ticket, so retries duplicate.',
		idempotent: false,
	},
	props: {
		ticketTypeId: Property.ShortText({
			displayName: 'Ticket Type ID',
			description: 'From List Ticket Types.',
			required: true,
		}),
		contactLookupBy: Property.StaticDropdown({
			displayName: 'Identify Contact By',
			required: true,
			defaultValue: 'id',
			options: {
				disabled: false,
				options: [
					{ label: 'Contact ID', value: 'id' },
					{ label: 'Email', value: 'email' },
					{ label: 'External ID', value: 'external_id' },
				],
			},
		}),
		contactValue: Property.ShortText({
			displayName: 'Contact',
			description: 'The contact ID, email or external ID, matching Identify Contact By. An unknown email creates a new contact.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		attributes: Property.Object({
			displayName: 'Other Attributes',
			description: 'Ticket type attributes by name, for example {"Priority": "<list option ID>", "Due": "2026-10-20T12:00:00Z"}.',
			required: false,
		}),
		companyId: Property.ShortText({
			displayName: 'Company ID',
			description: 'Optional Intercom company ID to link.',
			required: false,
		}),
	},
	outputSchema: ticketOutputSchema,
	async run(context) {
		const ticketTypeId = requireText({ label: 'Ticket Type ID', value: context.propsValue.ticketTypeId });
		const contactValue = requireText({ label: 'Contact', value: context.propsValue.contactValue });
		const lookupBy = context.propsValue.contactLookupBy;
		const contactKey = lookupBy === 'email' ? 'email' : lookupBy === 'external_id' ? 'external_id' : 'id';
		const { title, description } = context.propsValue;
		const values: Record<string, unknown> = {
			...(context.propsValue.attributes ?? {}),
			...(title?.trim() ? { _default_title_: title.trim() } : {}),
			...(description?.trim() ? { _default_description_: description.trim() } : {}),
		};
		const definitions = await getTicketTypeAttributes({ auth: context.auth, ticketTypeId });
		const missing = definitions
			.filter((definition) => definition.required_to_create === true && definition.archived !== true)
			.map((definition) => definition.name)
			.filter((name) => values[name] === undefined || values[name] === '');
		if (missing.length > 0) {
			throw new Error(`This ticket type requires: ${missing.join(', ')}.`);
		}
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['tickets'],
			body: {
				ticket_type_id: ticketTypeId,
				contacts: [{ [contactKey]: contactValue }],
				company_id: context.propsValue.companyId?.trim() || undefined,
				ticket_attributes: toTicketAttributes({ attributes: definitions, values }),
			},
			operation: 'create the ticket',
		});
	},
});
