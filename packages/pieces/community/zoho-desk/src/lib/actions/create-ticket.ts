import { createAction, Property } from '@activepieces/pieces-framework';
import { zohoDeskAuth } from '../auth';
import { zohoDeskApi } from '../common/api';
import { zohoDeskProps } from '../common/props';
import { createTicketOutputSchema } from '../output-schemas';

export const createTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'create_ticket',
	outputSchema: createTicketOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Ticket',
	description: 'Creates a new ticket.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new support ticket in a Zoho Desk organization. Use when an agent needs to log a new issue or request; requires the organization ID, a department ID, a subject, and a description, with optional contact, status, priority, channel, assignee, and custom fields. Not idempotent — each call creates a separate ticket.', idempotent: false },
	props: {
		orgId: zohoDeskProps.orgId({ required: true }),
		departmentId: zohoDeskProps.departmentId({ required: true }),
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			required: false,
			description: 'ID of the contact raising the ticket',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
			description: 'Subject of the ticket',
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: true,
			description: 'Description of the issue in the ticket',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
			description: 'Email address of the contact raising the ticket',
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
			description: 'Phone number of the contact raising the ticket',
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			description: 'Status of the ticket',
			options: {
				options: [
					{ label: 'Open', value: 'Open' },
					{ label: 'On Hold', value: 'On Hold' },
					{ label: 'Escalated', value: 'Escalated' },
					{ label: 'Closed', value: 'Closed' },
				],
			},
			defaultValue: 'Open',
		}),
		priority: Property.StaticDropdown({
			displayName: 'Priority',
			required: false,
			description: 'Priority of the ticket',
			options: {
				options: [
					{ label: 'Low', value: 'Low' },
					{ label: 'Medium', value: 'Medium' },
					{ label: 'High', value: 'High' },
					{ label: 'Urgent', value: 'Urgent' },
				],
			},
			defaultValue: 'Medium',
		}),
		category: Property.ShortText({
			displayName: 'Category',
			required: false,
			description: 'Category of the ticket',
		}),
		subCategory: Property.ShortText({
			displayName: 'Sub Category',
			required: false,
			description: 'Sub-category of the ticket',
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			required: false,
			description: 'Due date for the ticket (ISO format)',
		}),
		channel: Property.StaticDropdown({
			displayName: 'Channel',
			required: false,
			description: 'Channel through which the ticket is created',
			options: {
				options: [
					{ label: 'Email', value: 'Email' },
					{ label: 'Phone', value: 'Phone' },
					{ label: 'Chat', value: 'Chat' },
					{ label: 'Web', value: 'Web' },
					{ label: 'Social', value: 'Social' },
				],
			},
			defaultValue: 'Web',
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			required: false,
			description: 'ID of the agent to whom the ticket is assigned',
		}),
		productId: Property.ShortText({
			displayName: 'Product ID',
			required: false,
			description: 'ID of the product to which the ticket belongs',
		}),
		classification: Property.ShortText({
			displayName: 'Classification',
			required: false,
			description: 'Classification of the ticket',
		}),
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			description: 'Language of the ticket',
			defaultValue: 'English',
		}),
		entitySkills: Property.Array({
			displayName: 'Entity Skills',
			required: false,
			description: 'Array of skill IDs associated with the ticket',
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			required: false,
			description: 'Custom fields in the ticket',
		}),
	},
	async run({ propsValue, auth }) {
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
		} = propsValue;

		return await zohoDeskApi.createTicket({
			auth,
			orgId,
			departmentId,
			subject,
			description,
			contactId,
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
		});
	},
});
