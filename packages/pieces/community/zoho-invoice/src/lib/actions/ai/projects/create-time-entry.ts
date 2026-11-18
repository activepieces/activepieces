import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const createTimeEntryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_time_entry',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Create Time Entry',
	description: 'Logs time spent on a project task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Logs time a user spent on a project task, as a duration or a begin and end time, or starts a timer. Use List Projects for the project ID, List Tasks for the task ID and List Project Users for the user ID. Not idempotent: each call logs another entry.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		taskId: zohoInvoiceAiProps.taskId({ required: true }),
		userId: zohoInvoiceAiProps.userId({
			required: true,
			description: 'ID of a user on the project. Use List Project Users to find it.',
		}),
		logDate: Property.ShortText({
			displayName: 'Date',
			description: 'Day the time was spent, as yyyy-mm-dd.',
			required: true,
		}),
		logTime: Property.ShortText({
			displayName: 'Duration',
			description: 'Time spent, as HH:mm. Send this or Begin Time and End Time.',
			required: false,
		}),
		beginTime: Property.ShortText({
			displayName: 'Begin Time',
			description: 'Time the work started, as HH:mm.',
			required: false,
		}),
		endTime: Property.ShortText({
			displayName: 'End Time',
			description: 'Time the work ended, as HH:mm.',
			required: false,
		}),
		isBillable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Billable',
			description: 'Whether the time can be billed to the customer. Empty = the vendor default.',
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes about the work done.',
			required: false,
		}),
		startTimer: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Start Timer',
			description:
				'Yes to start a running timer on this entry instead of logging a fixed duration.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createTimeEntry({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					project_id: propsValue.projectId,
					task_id: propsValue.taskId,
					user_id: propsValue.userId,
					log_date: propsValue.logDate,
					log_time: propsValue.logTime,
					begin_time: propsValue.beginTime,
					end_time: propsValue.endTime,
					is_billable: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.isBillable }),
					notes: propsValue.notes,
					start_timer: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.startTimer }),
				}),
			},
		});
	},
});
