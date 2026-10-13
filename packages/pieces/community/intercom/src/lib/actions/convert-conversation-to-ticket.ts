import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { requireText } from '../common/lookups';
import { getTicketTypeAttributes, toTicketAttributes } from '../common/ticket-attributes';
import { ticketOutputSchema } from '../output-schemas';

export const convertConversationToTicketAction = createAction({
	auth: intercomAuth,
	name: 'convert_conversation_to_ticket',
	classification: 'WRITE',
	displayName: 'Convert Conversation to Ticket',
	description: 'Turns a conversation into a ticket of the chosen ticket type.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Turns an existing conversation into a ticket of the given ticket type (only Customer-category types), optionally setting ticket attributes. The customer may be notified. Converting is a one-off change, so retries fail or duplicate; it is not idempotent.',
		idempotent: false,
	},
	props: {
		conversationId: Property.ShortText({ displayName: 'Conversation ID', required: true }),
		ticketTypeId: Property.ShortText({
			displayName: 'Ticket Type ID',
			description: 'From List Ticket Types.',
			required: true,
		}),
		attributes: Property.Object({
			displayName: 'Ticket Attributes',
			description: 'Optional attributes by name. Dates take ISO 8601; list attributes take the option ID.',
			required: false,
		}),
	},
	outputSchema: ticketOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const ticketTypeId = requireText({ label: 'Ticket Type ID', value: context.propsValue.ticketTypeId });
		const values = context.propsValue.attributes ?? {};
		const attributes =
			Object.keys(values).length > 0
				? toTicketAttributes({
						attributes: await getTicketTypeAttributes({ auth: context.auth, ticketTypeId }),
						values,
				  })
				: undefined;
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations', conversationId, 'convert'],
			body: { ticket_type_id: ticketTypeId, attributes },
			operation: 'convert the conversation to a ticket',
		});
	},
});
