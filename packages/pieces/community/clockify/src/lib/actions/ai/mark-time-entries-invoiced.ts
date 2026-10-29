import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { invoicedOutputSchema } from '../../output-schemas';

export const markTimeEntriesInvoicedAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_mark_time_entries_invoiced',
	outputSchema: invoicedOutputSchema,
	displayName: 'Mark Time Entries Invoiced',
	description: 'Marks time entries as invoiced or not invoiced.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks time entries as invoiced (or back to not invoiced when Invoiced is false), for example after billing them outside Clockify. Needs workspace admin and a Clockify plan with invoicing (Standard or higher).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		timeEntryIds: clockifyAiProps.timeEntryIds({ required: true }),
		invoiced: Property.Checkbox({
			displayName: 'Invoiced',
			description: 'true = invoiced, false = not invoiced.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		await clockifyApi.markTimeEntriesInvoiced({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryIds: propsValue.timeEntryIds.map(String),
			invoiced: propsValue.invoiced,
		});
		return {
			success: true,
			invoiced: propsValue.invoiced,
			timeEntryIds: propsValue.timeEntryIds.map(String),
		};
	},
});
