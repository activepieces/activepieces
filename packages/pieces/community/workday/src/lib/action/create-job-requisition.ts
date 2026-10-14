import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createJobRequisition = createAction({
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
			description: 'Worker type reference ID (Worker_Type_ID), e.g. `EE`. Required when the tenant has no default.',
			required: false,
		}),
		workerSubTypeId: Property.ShortText({
			displayName: 'Worker Sub-Type ID',
			description: 'Worker sub-type reference ID (Employee_Type_ID), e.g. `Regular`. Required when the tenant has no default.',
			required: false,
		}),
		primaryLocationId: Property.ShortText({
			displayName: 'Primary Location ID',
			description: 'Primary location WID, also used as the primary job posting location.',
			required: false,
		}),
		recruitingStartDate: Property.ShortText({
			displayName: 'Recruiting Start Date',
			description: 'Date to start recruiting (YYYY-MM-DD).',
			required: false,
		}),
		targetHireDate: Property.ShortText({
			displayName: 'Target Hire Date',
			description: 'Target date for hiring (YYYY-MM-DD).',
			required: false,
		}),
	},
	async run(ctx) {
		const {
			supervisoryOrganizationId,
			reasonId,
			jobPostingTitle,
			numberOfOpenings,
			jobProfileId,
			workerTypeId,
			workerSubTypeId,
			primaryLocationId,
			recruitingStartDate,
			targetHireDate,
		} = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		const openings = numberOfOpenings ?? 1;

		let recruitingStartDateXml = '';
		if (recruitingStartDate) {
			recruitingStartDateXml = `
            <bsvc:Recruiting_Start_Date>${escapeXml(recruitingStartDate)}</bsvc:Recruiting_Start_Date>`;
		}

		let targetHireDateXml = '';
		if (targetHireDate) {
			targetHireDateXml = `
            <bsvc:Target_Hire_Date>${escapeXml(targetHireDate)}</bsvc:Target_Hire_Date>`;
		}

		const jobProfileXml = jobProfileId
			? `
          <bsvc:Job_Profile_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(jobProfileId)}</bsvc:ID>
          </bsvc:Job_Profile_Reference>`
			: '';

		const primaryLocationXml = primaryLocationId
			? `
          <bsvc:Primary_Location_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(primaryLocationId)}</bsvc:ID>
          </bsvc:Primary_Location_Reference>
          <bsvc:Primary_Job_Posting_Location_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(primaryLocationId)}</bsvc:ID>
          </bsvc:Primary_Job_Posting_Location_Reference>`
			: '';

		const workerTypeXml = workerTypeId
			? `
          <bsvc:Worker_Type_Reference>
            <bsvc:ID bsvc:type="Worker_Type_ID">${escapeXml(workerTypeId)}</bsvc:ID>
          </bsvc:Worker_Type_Reference>`
			: '';

		const workerSubTypeXml = workerSubTypeId
			? `
          <bsvc:Worker_Sub-Type_Reference>
            <bsvc:ID bsvc:type="Employee_Type_ID">${escapeXml(workerSubTypeId)}</bsvc:ID>
          </bsvc:Worker_Sub-Type_Reference>`
			: '';

		const reasonIdKind = WID_PATTERN.test(reasonId) ? 'WID' : 'General_Event_Subcategory_ID';

		const operationXml = `
    <bsvc:Create_Requisition_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Create_Job_Requisition_Data>
        <bsvc:Supervisory_Organization_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(supervisoryOrganizationId)}</bsvc:ID>
        </bsvc:Supervisory_Organization_Reference>
        <bsvc:Create_Job_Requisition_Reason_Reference>
          <bsvc:ID bsvc:type="${reasonIdKind}">${escapeXml(reasonId)}</bsvc:ID>
        </bsvc:Create_Job_Requisition_Reason_Reference>
        <bsvc:Number_of_Openings>${openings}</bsvc:Number_of_Openings>
        <bsvc:Job_Requisition_Data>
          <bsvc:Job_Posting_Title>${escapeXml(jobPostingTitle)}</bsvc:Job_Posting_Title>${recruitingStartDateXml}${targetHireDateXml}${jobProfileXml}${workerTypeXml}${workerSubTypeXml}${primaryLocationXml}
        </bsvc:Job_Requisition_Data>
      </bsvc:Create_Job_Requisition_Data>
    </bsvc:Create_Requisition_Request>`;

		return workdaySoapRequest(
			ctx.auth,
			'Recruiting',
			operationXml,
		);
	},
});

const WID_PATTERN = /^[0-9a-f]{32}$/i;
