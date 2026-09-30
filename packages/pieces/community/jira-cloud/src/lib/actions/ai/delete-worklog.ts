import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiProps } from '../../common/ai-props';

import { deleteWorklogOutputSchema } from '../../output-schemas';
export const deleteWorklogAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_worklog',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Worklog',
	description: 'Deletes a worklog from an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete one worklog entry from an issue, restoring the logged time to the remaining estimate automatically unless told otherwise. Worklog IDs come from Get Worklogs. Not idempotent: a retry returns not found.',
		idempotent: false,
	},
	outputSchema: deleteWorklogOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		worklogId: Property.ShortText({
			displayName: 'Worklog ID',
			description: 'The numeric worklog ID. Find it with Get Worklogs.',
			required: true,
		}),
		adjustEstimate: Property.StaticDropdown({
			displayName: 'Adjust Remaining Estimate',
			description: 'How to update the remaining estimate. Defaults to auto (increase by the deleted time).',
			required: false,
			options: {
				options: [
					{ label: 'Auto (increase by deleted time)', value: 'auto' },
					{ label: 'Leave unchanged', value: 'leave' },
					{ label: 'Set to New Estimate', value: 'new' },
					{ label: 'Increase by Increase By', value: 'manual' },
				],
			},
		}),
		newEstimate: Property.ShortText({
			displayName: 'New Estimate',
			description: 'New remaining estimate, e.g. 2d. Required when Adjust Remaining Estimate is Set to New Estimate.',
			required: false,
		}),
		increaseBy: Property.ShortText({
			displayName: 'Increase By',
			description: 'Amount to increase the remaining estimate by, e.g. 2h. Required when Adjust Remaining Estimate is Increase by Increase By.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const worklogId = propsValue.worklogId.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.DELETE,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/worklog/${encodeURIComponent(worklogId)}`,
			query: {
				adjustEstimate: propsValue.adjustEstimate,
				newEstimate: propsValue.adjustEstimate === 'new' ? propsValue.newEstimate : undefined,
				increaseBy: propsValue.adjustEstimate === 'manual' ? propsValue.increaseBy : undefined,
			},
		});
		return { success: true, issue: issueIdOrKey, worklog_id: worklogId, deleted: true };
	},
});
