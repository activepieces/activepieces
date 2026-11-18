import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const createJobRequisitionAction = createAction({
	auth: workdayAuth,
	name: 'create_job_requisition',
	classification: 'WRITE',
	displayName: 'Create Job Requisition',
	description: 'Creates a new job requisition in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates and auto-completes a job requisition under a supervisory organization (by WID) with a creation-reason WID, posting title, and number of openings, optionally setting job profile, location, recruiting-start, and target-hire dates. Use to open a new req before recruiting/hiring. Not idempotent: each call creates a separate requisition.',
		idempotent: false,
	},
	props: {
		supervisoryOrganizationId: Property.ShortText({
			displayName: 'Supervisory Organization ID',
			description: 'The supervisory organization for the requisition.',
			required: true,
		}),
		reasonId: Property.ShortText({
			displayName: 'Reason ID',
			description:
				'Creation reason as a General_Event_Subcategory_ID (e.g. `Create_Job_Requisition_Administrative_Non_Competitive_Fill_No_Recruiting_Required`) or a WID.',
			required: true,
		}),
		jobPostingTitle: Property.ShortText({
			displayName: 'Job Posting Title',
			description: 'The title for the job posting.',
			required: true,
		}),
		numberOfOpenings: Property.Number({
			displayName: 'Number of Openings',
			description: 'Number of openings (default: 1).',
			required: false,
			defaultValue: 1,
		}),
		jobProfileId: Property.ShortText({
			displayName: 'Job Profile ID',
			description: 'Job profile reference ID.',
			required: false,
		}),
		workerTypeId: Property.ShortText({
			displayName: 'Worker Type ID',
			description:
				'Worker type reference ID (Worker_Type_ID), e.g. `EE`. Required when the tenant has no default.',
			required: false,
		}),
		workerSubTypeId: Property.ShortText({
			displayName: 'Worker Sub-Type ID',
			description:
				'Worker sub-type reference ID (Employee_Type_ID), e.g. `Regular`. Required when the tenant has no default.',
			required: false,
		}),
		primaryLocationId: Property.ShortText({
			displayName: 'Primary Location ID',
			description: 'Primary location WID, also used as the primary job posting location.',
			required: false,
		}),
		recruitingStartDate: Property.ShortText({
			displayName: 'Recruiting Start Date',
			description: 'Date to start recruiting (YYYY-MM-DD). Required by Workday.',
			required: true,
		}),
		targetHireDate: Property.ShortText({
			displayName: 'Target Hire Date',
			description: 'Target date for hiring (YYYY-MM-DD). Required by Workday.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.createJobRequisition({
			auth,
			supervisoryOrganizationId: propsValue.supervisoryOrganizationId,
			reasonId: propsValue.reasonId,
			jobPostingTitle: propsValue.jobPostingTitle,
			numberOfOpenings: propsValue.numberOfOpenings,
			jobProfileId: propsValue.jobProfileId,
			workerTypeId: propsValue.workerTypeId,
			workerSubTypeId: propsValue.workerSubTypeId,
			primaryLocationId: propsValue.primaryLocationId,
			recruitingStartDate: propsValue.recruitingStartDate,
			targetHireDate: propsValue.targetHireDate,
		});
	},
});
