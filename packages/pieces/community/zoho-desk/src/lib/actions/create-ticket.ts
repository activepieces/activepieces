import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zohoDeskAuth } from '../common/auth';
import { zohoDeskApiCall } from '../common';
import { departmentId, organizationId } from '../common/props';

export const createTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'create_ticket',
	displayName: 'Create Ticket',
	description: 'Creates a new ticket.',
	props: {
		orgId: organizationId({ displayName: 'Organization', required: true }),
		departmentId: departmentId({ displayName: 'Department', required: true }),
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

		const requestBody: Record<string, any> = {
			departmentId,
			subject,
			description,
		};

		if (contactId) requestBody['contactId'] = contactId;
		if (email) requestBody['email'] = email;
		if (phone) requestBody['phone'] = phone;
		if (status) requestBody['status'] = status;
		if (priority) requestBody['priority'] = priority;
		if (category) requestBody['category'] = category;
		if (subCategory) requestBody['subCategory'] = subCategory;
		if (dueDate) requestBody['dueDate'] = dueDate;
		if (channel) requestBody['channel'] = channel;
		if (assigneeId) requestBody['assigneeId'] = assigneeId;
		if (productId) requestBody['productId'] = productId;
		if (classification) requestBody['classification'] = classification;
		if (language) requestBody['language'] = language;
		if (entitySkills && entitySkills.length > 0) requestBody['entitySkills'] = entitySkills;
		if (customFields) requestBody['cf'] = customFields;

		const response = await zohoDeskApiCall({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/tickets',
			orgId,
			body: requestBody,
		});

		return response;
	},
});
