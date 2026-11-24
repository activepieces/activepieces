import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUpdateTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_ticket',
	outputSchema: zohoDeskUpdateTicketOutputSchema,
	displayName: 'Update Ticket',
	description: 'Updates fields on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one ticket (status, priority, assignee, due date, custom fields, …); fields left empty are not changed and cannot be cleared here. Use Move Ticket to change its department and Close Tickets to close several at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'New subject.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description; HTML is allowed.',
			required: false,
		}),
		status: Property.ShortText({
			displayName: 'Status',
			description:
				'Ticket status name, e.g. "Open", "On Hold", "Escalated" or "Closed". Custom statuses are listed by List Fields (module tickets, field status).',
			required: false,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority name, e.g. "Low", "Medium", "High" or "Urgent".',
			required: false,
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID to assign the ticket to (from List Agents).',
			required: false,
		}),
		contactId: zohoDeskAiProps.contactId({
			required: false,
			description: 'Contact ID to set as the requester.',
		}),
		productId: zohoDeskAiProps.productId({ required: false }),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Ticket category.',
			required: false,
		}),
		subCategory: Property.ShortText({
			displayName: 'Sub Category',
			description: 'Ticket sub-category.',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			description: 'Due date, ISO 8601.',
			required: false,
		}),
		channel: Property.ShortText({
			displayName: 'Channel',
			description: 'Channel, e.g. "Email", "Phone", "Web" or "Chat".',
			required: false,
		}),
		classification: Property.ShortText({
			displayName: 'Classification',
			description: 'Classification, e.g. "Question" or "Problem".',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Ticket language.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Requester email shown on the ticket.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Requester phone shown on the ticket.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name, e.g. {"cf_order_id": "1234"}.',
			required: false,
		}),
		disableClosureNotification: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Disable Closure Notification',
			description:
				'Yes skips the email Zoho sends to the contact when this update closes the ticket.',
		}),
	},
	async run(context) {
		const {
			orgId,
			ticketId,
			subject,
			description,
			status,
			priority,
			assigneeId,
			contactId,
			productId,
			category,
			subCategory,
			dueDate,
			channel,
			classification,
			language,
			email,
			phone,
			customFields,
			disableClosureNotification,
		} = context.propsValue;
		return await zohoDeskApi.updateTicket({
			auth: context.auth,
			orgId,
			ticketId,
			subject,
			description,
			status,
			priority,
			assigneeId,
			contactId,
			productId,
			category,
			subCategory,
			dueDate,
			channel,
			classification,
			language,
			email,
			phone,
			customFields,
			disableClosureNotification,
		});
	},
});
