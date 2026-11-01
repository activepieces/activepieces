import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const changeJobAction = createAction({
	auth: workdayAuth,
	name: 'change_job',
	classification: 'WRITE',
	displayName: 'Change Job',
	description: 'Changes the job for a worker in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			"Initiates and auto-completes a Change Job business process for an existing worker (by worker WID), effective on a given date with a reason WID, optionally moving them to a new job profile, supervisory organization, and/or position. Use to record a worker's transfer, promotion, or reorganization. Not idempotent: each call submits a new job-change event.",
		idempotent: false,
	},
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker whose job to change.',
			required: true,
		}),
		effectiveDate: Property.ShortText({
			displayName: 'Effective Date',
			description: 'Effective date of the job change (YYYY-MM-DD).',
			required: true,
		}),
		reasonId: Property.ShortText({
			displayName: 'Reason ID',
			description: 'The reason for the job change.',
			required: true,
		}),
		jobProfileId: Property.ShortText({
			displayName: 'Job Profile ID',
			description: 'New job profile reference ID.',
			required: false,
		}),
		supervisoryOrganizationId: Property.ShortText({
			displayName: 'Supervisory Organization ID',
			description: 'New supervisory organization reference ID.',
			required: false,
		}),
		positionId: Property.ShortText({
			displayName: 'Position ID',
			description: 'New position reference ID.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.changeJob({
			auth,
			workerId: propsValue.workerId,
			effectiveDate: propsValue.effectiveDate,
			reasonId: propsValue.reasonId,
			jobProfileId: propsValue.jobProfileId,
			supervisoryOrganizationId: propsValue.supervisoryOrganizationId,
			positionId: propsValue.positionId,
		});
	},
});
