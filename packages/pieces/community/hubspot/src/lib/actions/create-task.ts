import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createTaskOutputSchema } from '../output-schemas';
import { ASSOCIATION_TYPE_IDS, HUBSPOT_DEFINED } from '../common/constants';

export const createTaskAction = createAction({
	auth: hubspotAuth,
	name: 'create_task',
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Creates a task against a CRM record.',
	audience: 'ai',
	outputSchema: createTaskOutputSchema,
	aiMetadata: {
		description:
			'Creates a task attached to a contact, company, deal or ticket, with a subject, an optional body, a due date and an owner. Use it to schedule follow-up work; use Create Note to record something that already happened. The due date is an ISO 8601 timestamp and defaults to now if omitted, and the owner id comes from List Owners. Each call creates another task, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'The task title shown in HubSpot.',
			required: true,
		}),
		associatedObjectType: Property.StaticDropdown({
			displayName: 'Attach To Object Type',
			description: 'The kind of record the task belongs to.',
			required: true,
			defaultValue: 'contact',
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
					{ label: 'Deal', value: 'deal' },
					{ label: 'Ticket', value: 'ticket' },
				],
			},
		}),
		associatedObjectId: Property.ShortText({
			displayName: 'Attach To Object ID',
			description: 'The id of the record, as returned by the matching Find or Get action.',
			required: true,
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description: 'ISO 8601 timestamp for when the task is due, such as 2026-09-20T09:00:00Z. Defaults to now.',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Optional detail shown on the task.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'NOT_STARTED',
			options: {
				options: [
					{ label: 'Not started', value: 'NOT_STARTED' },
					{ label: 'In progress', value: 'IN_PROGRESS' },
					{ label: 'Waiting', value: 'WAITING' },
					{ label: 'Completed', value: 'COMPLETED' },
					{ label: 'Deferred', value: 'DEFERRED' },
				],
			},
		}),
		priority: Property.StaticDropdown({
			displayName: 'Priority',
			required: false,
			defaultValue: 'MEDIUM',
			options: {
				options: [
					{ label: 'Low', value: 'LOW' },
					{ label: 'Medium', value: 'MEDIUM' },
					{ label: 'High', value: 'HIGH' },
				],
			},
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'The owner the task is assigned to, as returned by List Owners.',
			required: false,
		}),
	},
	async run(context) {
		const { subject, associatedObjectType, associatedObjectId, dueDate, body, status, priority, ownerId } =
			context.propsValue;

		const properties: Record<string, unknown> = {
			hs_timestamp: dueDate ?? new Date().toISOString(),
			hs_task_subject: subject,
			hs_task_status: status ?? 'NOT_STARTED',
			hs_task_priority: priority ?? 'MEDIUM',
		};
		if (body !== undefined && body !== '') {
			properties['hs_task_body'] = body;
		}
		if (ownerId !== undefined && ownerId !== '') {
			properties['hubspot_owner_id'] = ownerId;
		}

		const response = await httpClient.sendRequest<Record<string, unknown>>({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/crm/v3/objects/tasks',
			body: {
				properties,
				associations: [
					{
						to: { id: associatedObjectId },
						types: [
							{
								associationCategory: HUBSPOT_DEFINED,
								associationTypeId: ASSOCIATION_TYPE_IDS['TASK_TO'][associatedObjectType],
							},
						],
					},
				],
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		return response.body;
	},
});
