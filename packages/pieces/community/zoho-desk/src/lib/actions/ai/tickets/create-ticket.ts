import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { createTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_ticket',
	outputSchema: createTicketOutputSchema,
	displayName: 'Create Ticket',
	description: 'Creates a new ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a ticket in a department. Needs a Department ID (from List Departments), a subject and a description; link the requester with Contact ID (from Search Contacts or Create Contact). Not idempotent: each call creates a new ticket.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		contactId: zohoDeskAiProps.contactId({
			required: false,
			description: 'Contact ID of the requester (from Search Contacts or Create Contact).',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Ticket subject.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Ticket description; HTML is allowed.',
			required: true,
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
			description: 'Channel the ticket came in on, e.g. "Email", "Phone", "Web" or "Chat".',
			required: false,
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID to assign the ticket to (from List Agents).',
			required: false,
		}),
		productId: zohoDeskAiProps.productId({
			required: false,
			description: 'Product the ticket is about (from List Products).',
		}),
		classification: Property.ShortText({
			displayName: 'Classification',
			description: 'Classification, e.g. "Question", "Problem", "Feature" or "Others".',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Ticket language, e.g. "English".',
			required: false,
		}),
		entitySkills: Property.Array({
			displayName: 'Skill IDs',
			description: 'Skill IDs for skill-based assignment.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description:
				'Custom field values keyed by API name, e.g. {"cf_order_id": "1234"} (names from List Fields).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			departmentId,
			contactId,
			subject,
			description,
			email,
			phone,
			status,
			priority,
			category,
			subCategory,
			dueDate,
			channel,
			assigneeId,
			productId,
			classification,
			language,
			entitySkills,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.createTicket({
			auth: context.auth,
			orgId,
			departmentId,
			contactId,
			subject,
			description,
			email,
			phone,
			status,
			priority,
			category,
			subCategory,
			dueDate,
			channel,
			assigneeId,
			productId,
			classification,
			language,
			entitySkills: zohoDeskUtils.optionalStringList({
				value: entitySkills,
				propName: 'Skill IDs',
			}),
			customFields,
		});
	},
});
